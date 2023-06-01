import { Construct } from "constructs";
import {TerraformStack} from "cdktf/lib/terraform-stack";
import { ILambda, Lambda } from "arc-cdk";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Apigatewayv2Api } from "@cdktf/provider-aws/lib/apigatewayv2-api";
import { Apigatewayv2Route } from "@cdktf/provider-aws/lib/apigatewayv2-route";
import { Apigatewayv2Integration } from "@cdktf/provider-aws/lib/apigatewayv2-integration";
import { Apigatewayv2Deployment } from "@cdktf/provider-aws/lib/apigatewayv2-deployment";
import { Apigatewayv2Stage } from "@cdktf/provider-aws/lib/apigatewayv2-stage";
import { LambdaPermission } from "@cdktf/provider-aws/lib/lambda-permission";
import {DynamodbTable} from "@cdktf/provider-aws/lib/dynamodb-table";
import * as path from "path";
import * as dynamoModels from "../../dist/libs/dynamodb/src/models";

export class BackendStack extends TerraformStack {
  private readonly api: Apigatewayv2Api;

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

    this.api = new Apigatewayv2Api(this, "api", {
      protocolType: "HTTP",
      name: "eppendorf-api",
    });

    new Apigatewayv2Stage(this, 'api-stage', {
      name: process.env.STAGE || "dev",
      apiId: this.api.id,
    });

    const pingPongHandler = new Lambda(this, 'ping-pong-handler', {
      codePath: path.resolve(__dirname, "../../dist/apps/backend/ping-pong"),
      handler: "main.handler",
      runtime: "nodejs16.x",
      namespace: process.env.NAMESPACE || "eppendorf",
      name: "ping-pong",
      environment: process.env.ENV || "dev",
    } as ILambda);
    this.addLambdaEndpoint("GET", "/ping", pingPongHandler);

    new Apigatewayv2Deployment(this, 'api-deployment', {
      apiId: this.api.id,
    });
  }

  private createDynamoTables() {
    Object.values(dynamoModels).map((model) => {
      const pk = model.schemas[0].getHashKey();
      const sk = model.schemas[0].getRangeKey();

      new DynamodbTable(this, `${model.name}-table`, {
        name: model.name,
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

  private addLambdaEndpoint(method: string, path: string, handler: Lambda) {
    new LambdaPermission(this, "ping-pong-permission", {
      action: "lambda:InvokeFunction",
      functionName: handler.lambdaFunc.functionName,
      principal: "apigateway.amazonaws.com",
      sourceArn: `${this.api.executionArn}/*/*`,
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
}
