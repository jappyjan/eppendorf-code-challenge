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

export class BackendStack extends TerraformStack {
  private api!: Apigatewayv2Api;
  private dynamoTables: Record<string, DynamodbTable> = {};

  constructor(scope: Construct, id: string) {
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

    this.createDynamoTables();

    this.createApiGatewayApi();

    const devicesListHandler = this.createLambda(
      "devices-list-handler",
      path.resolve(__dirname, "../../dist/apps/backend/devices/list"),
      "main.handler",
      {
        dynamoReadTables: ['Devices'],
        dynamoWriteTables: ['Devices']
      },
    );

    this.addLambdaEndpoint({
      method: "GET",
      path: "/devices",
      handler: devicesListHandler,
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
      }
    });

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
