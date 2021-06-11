const shell = require("shelljs");
if (shell.exec("npm run test-recorder").code !== 0) {
	shell.echo("Error: npm run test-recorder");
	shell.exit(1);
}
