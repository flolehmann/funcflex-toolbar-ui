# Toolbar UI Prototype, as part of the paper "Functional Flexibility in Generative AI Interfaces"

This prototype allows to use specified and flexible AI functions on text documents via interactive comments.

See the paper on arxiv: https://arxiv.org/abs/2410.10644

## Run the prototype locally

This prototype has been build in 2022 and thus runs on Node version 12.22.12 and npm 6.14.16. Please note,
that we did not update the dependencies, and it might be unsafe to run this project online.

If you plan to run the prototype locally follow these steps:

1. Install node version `erbium`, e.g. use nvm: `nvm install 12.22.12`
2. Activate the node version: `nvm use 12.22.12`
3. Install dependencies `npm install`
4. Run the project: `npm run start`

The prototype will be available in your browser, e.g. at `http://localhost:3000/`

To enable the AI toolbar:

1. Start the model APIs:
    - OPUS-MT: https://github.com/flolehmann/funcflex-modelapi-opusmt
    - T5: https://github.com/flolehmann/funcflex-modelapi-t5
    - GPT-neo: https://github.com/flolehmann/funcflex-modelapi-gptneo
2. Create a .env file with your OpenAI API key `REACT_APP_OPENAI_KEY = "YOUR KEY"`

Finally, put the URLs to the model APIs into the [Apis.js](src%2Fintelligence%2FApis.js)

You are all set! Have fun using the prototype!

## Deploy the prototype for experimental purpose

You can use docker-compose to deploy the prototype for experimental purpose.
Use the existing [docker-compose.toolset.prod.yml](docker-compose.toolset.prod.yml) as a basis for doing so.

Just execute `docker-compose -f docker-compose.toolset.prod.yml up -d` to run a dockerized version of the project.





# We initiated this project with create React app:

#Getting Started with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `yarn build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
