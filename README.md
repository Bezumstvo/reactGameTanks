## default Application
analog: 

>npx create-react-app <DIR_NAME>
>cd DIR_NAME
>npm install -D eslint prettier
>npx install-peerdeps --dev eslint-config-airbnb
>npm install -D eslint-config-prettier eslint-plugin-prettier

* .eslintrc.json

>{
>"extends": ["airbnb", "prettier"],
>"plugins": ["prettier"],
>"rules": {
>"prettier / prettier": ["error"]
>}
>}

* .prettierrc
>{
>"printWidth": 100,
>"singleQuote": true
>}

* .vscode/ setting.json
>{
>"editor.formatOnSave": true
>}
