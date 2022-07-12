# Datalakes Serverless AWS NodeJS

In order to improve scalability of Datalakes and to reduce load on the master API certain endpoints have been deployed in Serverless. 

## Usage

### Deployment

In order to deploy the API, you need configure AWS credentials and then run the following command:

```
$ serverless deploy
```

### Local development

You can invoke your function locally by using the following command:

```bash
serverless offline
```
