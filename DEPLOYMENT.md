# Deployment
The deployment is usually happening automatically on commits to the main branch using Github Actions.
See `.github/workflows/main.yml` for details.

## Manual Deployment
If you want to manually trigger a deployment, you first need to set your AWS CLI credentials as environment variables.
```bash
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=...
```

Then you need to install all project dependencies as well as the nx and terraform cdk cli.
There might be a dependency tree error from one of the terraform modules i installed,
to overcome it, simply add the `--force` flag to the `npm install` command.
```bash
npm install
npm install -g nx@latest
npm install -g cdktf-cli@latest
```

After that you can build the projects and run the terraform deployment
```bash
nx run-many --target=build --all --parallel
cdktf deploy backend frontend
```
