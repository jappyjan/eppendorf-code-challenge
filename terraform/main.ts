import { Construct } from "constructs";
import { App, TerraformStack, CloudBackend, NamedCloudWorkspace } from "cdktf";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // define resources here
  }
}

const app = new App();
const stack = new MyStack(app, "terraform");

new CloudBackend(stack, {
  hostname: "app.terraform.io",
  organization: "JanJaap-WebSolutions",
  workspaces: new NamedCloudWorkspace("eppendorf-coding-challenge")
});

app.synth();
