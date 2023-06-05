import {Construct} from "constructs";
import {TerraformStack} from "cdktf/lib/terraform-stack";
import {AwsProvider} from "@cdktf/provider-aws/lib/provider";
import {ILambda, Lambda} from "arc-cdk";
import {Apigatewayv2Api} from "@cdktf/provider-aws/lib/apigatewayv2-api";
import {DynamodbTable} from "@cdktf/provider-aws/lib/dynamodb-table";
import {Apigatewayv2Route} from "@cdktf/provider-aws/lib/apigatewayv2-route";
import {Apigatewayv2Integration} from "@cdktf/provider-aws/lib/apigatewayv2-integration";
import {Apigatewayv2Stage} from "@cdktf/provider-aws/lib/apigatewayv2-stage";
import {LambdaPermission} from "@cdktf/provider-aws/lib/lambda-permission";
import * as path from "path";
import * as dynamoModels from "../../dist/libs/dynamodb/src/models";
import type {Model} from "dynamoose/dist/Model";

interface LambdaEndpoint {
  method: string;
  path: string;
  handler: Lambda;
}

interface IAMPolicyStatement {
  Action: string;
  Effect: string;
  Resource: string;
}

interface CreateLambdaOptions {
  dynamoReadTables: string[];
  dynamoWriteTables: string[];
}

interface CreateEndpointParams {
  handlerLocation: string;
  handlerName: string;
  path: string;
  method: string;
  dynamoReadTables: string[];
  dynamoWriteTables: string[];
  internalName: string;
}

export class BackendStack extends TerraformStack {
  private api!: Apigatewayv2Api;
  private dynamoTables: Record<string, DynamodbTable> = {};

  // private readonly awsProviderUsEast: AwsProvider;

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

    /*
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
     */

    this.createDynamoTables();

    this.createApiGatewayApi();

    this.createEndpoint({
        handlerLocation: path.resolve(__dirname, "../../dist/apps/backend/devices/list"),
        handlerName: "main.handler",
        path: "/devices",
        method: "GET",
        dynamoReadTables: ['Devices'],
        dynamoWriteTables: [],
        internalName: 'list',
      },
    );

    this.createEndpoint({
      handlerLocation: path.resolve(__dirname, "../../dist/apps/backend/devices/upsert"),
      handlerName: "main.handler",
      path: "/devices",
      method: "POST",
      dynamoReadTables: [],
      dynamoWriteTables: ['Devices'],
      internalName: 'upsert',
    });

    this.createEndpoint({
      handlerLocation: path.resolve(__dirname, "../../dist/apps/backend/devices/delete"),
      handlerName: "main.handler",
      path: "/devices/{deviceType}/{deviceId}",
      method: "DELETE",
      dynamoReadTables: [],
      dynamoWriteTables: ['Devices'],
      internalName: 'delete',
    });
  }

  private createEndpoint(
    params: CreateEndpointParams,
  ) {
    const {
      handlerLocation,
      handlerName,
      path,
      method,
      dynamoReadTables,
      dynamoWriteTables,
      internalName,
    } = params;

    const handler = this.createLambda(
      `api-${internalName}`,
      handlerLocation,
      handlerName,
      {
        dynamoReadTables,
        dynamoWriteTables,
      },
    );

    this.addLambdaEndpoint({
      method,
      path,
      handler: handler,
    });
  }

  private createApiGatewayApi() {
    this.api = new Apigatewayv2Api(this, "api", {
      protocolType: "HTTP",
      name: "eppendorf-api",
      corsConfiguration: {
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowOrigins: ["*"],
        allowHeaders: ["*"],
      },
    });

    /*
    TODO: fix this, currently deployment fails when using a custom domain/certificate

    const domainName = 'eppendorf-api.aws.janjaap.de';

    const cert = new AcmCertificate(this, "api_cert", {
      domainName,
      validationMethod: "DNS",
      lifecycle: {
        createBeforeDestroy: true
      },
    });

    const hostedZone = new DataAwsRoute53Zone(this, "api_zone", {
      name: "aws.janjaap.de",
    });

    const record = new Route53Record(this, "api_validation_record", {
      name: cert.domainValidationOptions.get(0).resourceRecordName,
      type: cert.domainValidationOptions.get(0).resourceRecordType,
      records: [cert.domainValidationOptions.get(0).resourceRecordValue],
      zoneId: hostedZone.zoneId,
      ttl: 60
    });

    new AcmCertificateValidation(this, 'api-certificate-validation', {
      certificateArn: cert.arn,
      validationRecordFqdns: [record.fqdn],
      provider: this.awsProviderUsEast,
      timeouts: {
        create: '30m'
      }
    });

    new Apigatewayv2DomainName(this, 'api-domain', {
      domainName,
      domainNameConfiguration: {
        certificateArn: cert.arn,
        endpointType: 'REGIONAL',
        securityPolicy: 'TLS_1_2',
      },
    });

    */

    new Apigatewayv2Stage(this, 'api-stage', {
      name: process.env.STAGE || "dev",
      apiId: this.api.id,
    });
  }

  private createDynamoTables() {
    Object.entries(dynamoModels).map(([exportName, exportObject]) => {
      if (!exportName.endsWith('Model')) {
        return;
      }

      const tableName = exportName.replace('Model', '');

      const model = exportObject as Model<any>;

      const pk = model.schemas[0].getHashKey();
      const sk = model.schemas[0].getRangeKey();

      this.dynamoTables[tableName] = new DynamodbTable(this, `${tableName}-table`, {
        name: tableName,
        hashKey: pk,
        rangeKey: sk!,
        billingMode: "PAY_PER_REQUEST",
        attribute: [
          {
            name: 'PK',
            type: 'S',
          },
          {
            name: 'SK',
            type: 'S',
          }
        ],
      });
    });
  }

  private getDynamoPolicyStatements(dynamoReadTables: string[], dynamoWriteTables: string[]) {
    const statements: IAMPolicyStatement[] = [];

    for (const tableName of dynamoReadTables) {
      const table = this.dynamoTables[tableName as keyof typeof this.dynamoTables];

      if (!table) {
        throw new Error(`Table ${tableName} not found, available tables: ${Object.keys(this.dynamoTables).join(', ')}`);
      }

      statements.push({
        Action: "dynamodb:GetItem",
        Effect: "Allow",
        Resource: table.arn,
      });

      statements.push({
        Action: "dynamodb:Query",
        Effect: "Allow",
        Resource: table.arn,
      });

      statements.push({
        Action: "dynamodb:Scan",
        Effect: "Allow",
        Resource: table.arn,
      });
    }

    for (const tableName of dynamoWriteTables) {
      const table = this.dynamoTables[tableName as keyof typeof this.dynamoTables];

      if (!table) {
        throw new Error(`Table ${tableName} not found`);
      }

      statements.push({
        Action: "dynamodb:PutItem",
        Effect: "Allow",
        Resource: table.arn,
      });

      statements.push({
        Action: "dynamodb:UpdateItem",
        Effect: "Allow",
        Resource: table.arn,
      });

      statements.push({
        Action: "dynamodb:DeleteItem",
        Effect: "Allow",
        Resource: table.arn,
      });
    }

    return statements;
  }

  private addLambdaEndpoint(options: LambdaEndpoint) {
    const {
      method,
      path,
      handler,
    } = options;

    new LambdaPermission(this, `${method}-${path}-api-gw-permission`, {
      action: "lambda:InvokeFunction",
      functionName: handler.lambdaFunc.functionName,
      principal: "apigateway.amazonaws.com",
      sourceArn: this.api.executionArn + '/*/*',
    });

    const integration = new Apigatewayv2Integration(this, `${method}-${path}-integration`, {
      apiId: this.api.id,
      integrationType: "AWS_PROXY",
      integrationMethod: "POST",
      integrationUri: handler.lambdaFunc.invokeArn,
      payloadFormatVersion: "2.0",
    });

    new Apigatewayv2Route(this, `${method}-${path}-route`, {
      apiId: this.api.id,
      routeKey: `${method.toUpperCase()} ${path}`,
      target: `integrations/${integration.id}`,
    });
  }

  private createLambda(
    name: string,
    codePath: string,
    handler: string,
    options?: CreateLambdaOptions
  ) {
    const {
      dynamoReadTables = [],
      dynamoWriteTables = []
    } = options || {};

    const dynamoDbPolicyStatements = this.getDynamoPolicyStatements(dynamoReadTables, dynamoWriteTables);

    return new Lambda(this, name, {
      codePath,
      handler,
      name,
      runtime: "nodejs16.x",
      namespace: process.env.NAMESPACE || "eppendorf",
      environment: process.env.ENV || "dev",
      memorySize: 256,
      createRole: {
        iamRole: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Action: "sts:AssumeRole",
              Principal: {
                Service: "lambda.amazonaws.com",
              },
              Effect: "Allow",
              Sid: "",
            },
          ],
        }),
        iamPolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "ec2:CreateNetworkInterface",
                "ec2:DescribeNetworkInterfaces",
                "ec2:DeleteNetworkInterface",
                "ec2:AssignPrivateIpAddresses",
                "ec2:UnassignPrivateIpAddresses",
              ],
              Resource: "*",
            },
            ...dynamoDbPolicyStatements,
          ],
        }),
      }
    } as ILambda);
  }
}
