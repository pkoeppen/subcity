![sub.city](https://s3.amazonaws.com/pkoeppen/subcity_logo_alpha.png)

# https://sub.city
A collaborative paywall and subscription service build with [Serverless](https://serverless.com) and [Vue](https://vuejs.org).
Still under construction!

### Usage (subcity-client)
Install modules and run the development server...

`npm install && npm start`

...Or just build for production.

`npm build`

Environment variables can be modified via [env.yml](/env.yml) in the root directory.

### Usage (subcity-\*)
Serverless modules can be run locally with [serverless-offline](https://www.npmjs.com/package/serverless-offline) or in development mode with Amazon Web Services.
Install modules and deploy the service locally...

`npm install && serverless offline start`

...or deploy to AWS.

`serverless deploy`