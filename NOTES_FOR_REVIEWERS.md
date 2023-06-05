# Technology Decisions

## NX
I've chosen NX / a monorepo approach as i've learned in the past that this approach speeds up development of multi-layer applications immensely. It also helps to keep the code clean and maintainable.
Furthermore is allows for sharing code (e.g. interfaces for API communication) between the different layers.

## React
I've chosen React as it is a very popular frontend framework, it is used by Eppendorf and i am also ver familiar with it and therefore able to develop fast.

### Chakra UI
I've chosen Chakra UI as it is a very popular UI framework for React and i am also very familiar with it.
It includes all the components i need for this project and is very easy to use.

## Terraform
I've chosen to use Terraform (CDK) instead of AWS Cloudformation/CDK as Eppendorf is using it,
and i therefore wanted to get familiar with it, this did cost me quite a lot of time as i had to dig into the documentation quite a lot,
but i think it was worth it as i now have a better understanding of Terraform and it's advantages and disadvantages.

# Should be changed

## Separation of Create and Update of devices to prevent overwriting of data
Currently the same API endpoint is used for creating and updating devices, this is not ideal as it allows for overwriting of data without the user noticing.
I took this approach as i wanted to keep the API as simple as possible, but i think it would be better to separate the two endpoints in the future.

## Better PK/SK for device table
Currently i picked the device type and id as the PK and SK for DynamoDB,
doing the development i realised that this choice might not have been ideal,
therefore i would suggest researching/discovering what data will be stored alongside the devices and in which way we are going to query them,
and then pick a PK/SK that allows for the most efficient querying.

## Update PK/SK when changing device properties
Currently the PK/SK of a device is not updated when the device properties are changed,
as they are based on device properties (device type and id), this is not ideal as we will eventually end up with corrupt/invalid data.
I would suggest to update the PK/SK when the device properties are changed.

# Important to know

## NX cloud cache and CI
I've used the NX cloud cache and CI for this project, this means that the first build will take a while,
but all subsequent builds will be much faster as the cache is used.
This also means that logs from the CLI commands will be stored in the NX cloud and can be viewed there,
currently using the free plan which is not GDPR compliant.
If this ever goes live we would need to either disable the nx cloud functionality or use the paid plan.


# For the Future

## Authentication and Authorization
Currently there is no authentication and authorization implemented, this is not ideal as it allows for unauthorized access to the API.

## Logging
Currently there is no logging implemented, this is not ideal as it makes it hard to debug issues.
