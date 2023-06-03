import {Construct} from "constructs";
import {TerraformStack} from "cdktf/lib/terraform-stack";
import {AwsProvider} from "@cdktf/provider-aws/lib/provider";
import {S3Bucket} from "@cdktf/provider-aws/lib/s3-bucket";
import {S3Object} from "@cdktf/provider-aws/lib/s3-object";
import {DataAwsRoute53Zone} from "@cdktf/provider-aws/lib/data-aws-route53-zone";
import {AcmCertificate} from "@cdktf/provider-aws/lib/acm-certificate";
import {Route53Record} from "@cdktf/provider-aws/lib/route53-record";
import {AcmCertificateValidation} from "@cdktf/provider-aws/lib/acm-certificate-validation";
import {CloudfrontOriginAccessIdentity} from "@cdktf/provider-aws/lib/cloudfront-origin-access-identity";
import {DataAwsIamPolicyDocument} from "@cdktf/provider-aws/lib/data-aws-iam-policy-document";
import {S3BucketPolicy} from "@cdktf/provider-aws/lib/s3-bucket-policy";
import {CloudfrontDistribution} from "@cdktf/provider-aws/lib/cloudfront-distribution";
import * as path from "path";
import * as glob from 'glob';
import * as mime from 'mime-types';
import {AssetType, TerraformAsset} from "cdktf";
import {readFileSync} from "fs";
import {createHash} from "crypto";

export class FrontendStack extends TerraformStack {
  private hostedZone!: DataAwsRoute53Zone;
  private readonly awsProviderUsEast!: AwsProvider;
  private s3Bucket!: S3Bucket;
  private acmCertificate!: AcmCertificate;
  private distribution!: CloudfrontDistribution;

  public constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, "AWS", {
      region: process.env.AWS_REGION,
      accessKey: process.env.AWS_ACCESS_KEY_ID,
      secretKey: process.env.AWS_SECRET_ACCESS_KEY,
      assumeRole: [
        {
          roleArn: process.env.AWS_ROLE_ARN,
        },
      ],
    });

    this.awsProviderUsEast = new AwsProvider(this, "use_east", {
      accessKey: process.env.AWS_ACCESS_KEY_ID,
      secretKey: process.env.AWS_SECRET_ACCESS_KEY,
      assumeRole: [
        {
          roleArn: process.env.AWS_ROLE_ARN,
        },
      ],
      region: "us-east-1",
      alias: "us-east-1"
    });

    this.getHostedZone();
    this.createCertificate();
    this.createS3HostingBucket();
    this.createCloudFrontDistribution();
    this.createRoute53Record();
    this.uploadAssets();
  }

  private getHostedZone() {
    this.hostedZone = new DataAwsRoute53Zone(this, "website_zone", {
      name: "aws.janjaap.de",
    });
  }

  private createCertificate() {
    this.acmCertificate = new AcmCertificate(this, "website_cert", {
      domainName: "eppendorf.aws.janjaap.de",
      validationMethod: "DNS",
      provider: this.awsProviderUsEast,
      lifecycle: {
        createBeforeDestroy: true
      }
    });

    const record = new Route53Record(this, "website_validation_record", {
      name: this.acmCertificate.domainValidationOptions.get(0).resourceRecordName,
      type: this.acmCertificate.domainValidationOptions.get(0).resourceRecordType,
      records: [this.acmCertificate.domainValidationOptions.get(0).resourceRecordValue],
      zoneId: this.hostedZone.zoneId,
      ttl: 60
    });

    new AcmCertificateValidation(this, "website_certification_validation", {
      certificateArn: this.acmCertificate.arn,
      validationRecordFqdns: [record.fqdn],
      provider: this.awsProviderUsEast
    });
  }

  private createS3HostingBucket() {
    this.s3Bucket = new S3Bucket(this, "website_s3_bucket", {
      bucket: "eppendorf.aws.janjaap.de"
    });
  }

  private createCloudFrontDistribution() {
    const oai = new CloudfrontOriginAccessIdentity(this, "website_oai", {
      comment: "eppendorf.aws.janjaap.de"
    });

    const policyDocument = new DataAwsIamPolicyDocument(this, "website_bucket_policy_document", {
      statement: [{
        actions: ["s3:GetObject"],
        resources: [`${this.s3Bucket.arn}/*`],
        principals: [{
          type: "AWS",
          identifiers: [oai.iamArn]
        }]
      }]
    });

    new S3BucketPolicy(this, "website_connect_bucket_and_policy", {
      bucket: this.s3Bucket.id,
      policy: policyDocument.json
    });

    this.distribution = new CloudfrontDistribution(this, "website_distribution", {
      enabled: true,
      defaultRootObject: "index.html",
      aliases: ["eppendorf.aws.janjaap.de"],
      customErrorResponse: [
        {
          errorCode: 403,
          responseCode: 200,
          responsePagePath: "/"
        }
      ],
      origin: [
        {
          originId: this.s3Bucket.id,
          domainName: this.s3Bucket.bucketRegionalDomainName,
          s3OriginConfig: {
            originAccessIdentity: oai.cloudfrontAccessIdentityPath
          }
        }
      ],
      defaultCacheBehavior: {
        allowedMethods: ["GET", "HEAD"],
        cachedMethods: ["GET", "HEAD"],
        targetOriginId: this.s3Bucket.id,
        forwardedValues: {
          queryString: false,
          cookies: {
            forward: "none"
          }
        },
        viewerProtocolPolicy: "redirect-to-https",
        minTtl: 0,
        defaultTtl: 0,
        maxTtl: 0
      },
      restrictions: {
        geoRestriction: {
          restrictionType: "none"
        }
      },
      viewerCertificate: {
        acmCertificateArn: this.acmCertificate.arn,
        sslSupportMethod: "sni-only"
      }
    });
  }

  private createRoute53Record() {
    new Route53Record(this, "website_record", {
      zoneId: this.hostedZone.id,
      name: "eppendorf.aws.janjaap.de",
      type: "A",
      alias: {
        name: this.distribution.domainName,
        zoneId: this.distribution.hostedZoneId,
        evaluateTargetHealth: false,
      },
    });
  }

  private uploadAssets() {
    const fileLocationInRepository = '../dist/apps/frontend'
    const files = glob.sync(`${fileLocationInRepository}/**/*`, { absolute: false, nodir: true });

    // Create bucket object for each file
    for (const file of files) {
      const filePath = path.resolve(file);

      const fileBuffer = readFileSync(filePath);
      const hashSum = createHash('sha256');
      hashSum.update(fileBuffer);

      const fileHash = hashSum.digest('hex');

      const asset = new TerraformAsset(this, `website_asset_${path.basename(file)}`, {
        path: filePath,
        type: AssetType.FILE,
        assetHash: fileHash,
      });

      new S3Object(this, `website_s3_object_${path.basename(file)}`, {
        dependsOn: [this.s3Bucket],
        key: file.replace(fileLocationInRepository, ''),
        bucket: this.s3Bucket.bucket,
        source: asset.path,
        etag: `${Date.now()}`,
        contentType: mime.contentType(path.extname(file)) || undefined
      });
    }
  }
}
