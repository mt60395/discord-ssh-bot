const { spawn } = require("child_process");
const fs = require("fs");
const Discord = require("discord.js");

let client = new Discord.Client();
client.config = JSON.parse(fs.readFileSync("config.json", "utf8"));
const msgOpts = {
	code: "js",
	split: { char: "\n" },
};
const fmt = {
	bold: "\x1b[1m",
	green: "\x1b[32m",
	reset: "\x1b[0m",
};

const cmds = ["clear", "upload"]; // custom commands

async function exec(msg) {
	let output = "";
	let input = msg.content.substring(1);
	let args = input.split(" ");
	let command = args.shift();
	if (cmds.includes(command)) {
		switch (command) {
			case "clear":
				const messages = await msg.channel.messages.fetch({limit: 100}).catch(()=>{console.log("ERROR fetching messages.")});
				messages.forEach(message => {
					if (message.author.bot) {
						message.delete().catch(()=>{});
					}
				})
				break;
			case "upload":
				args.forEach(fileName => {
					msg.channel.send({
						files: [{
							attachment: fileName,
							name: fileName.substring(fileName.lastIndexOf("/") + 1)
						}]
					});
				});
		}
	}
	else {
		let cmd = spawn(command, args, {
			shell: true,
			env: { COLUMNS: 128 },
		});
		cmd.stdout.on("data", data => {
			// process.stdout.write(data);
			output += data;
		});
		cmd.stderr.on("data", data => {
			// process.stderr.write(data);
			output += data;
		});
		cmd.on("exit", () => {
			if (output) msg.channel.send(Discord.Util.cleanCodeBlockContent(output, true), msgOpts);
		});
	}
}

client.on("message", msg => {
	if (msg.author === client.config.owner && msg.content.startsWith("!")) {
		// console.log(msg.content);
		exec(msg);
	}
});

client.on("ready", async () => {
	client.config.owner = await client.users.fetch(client.config.owner);
	if (!client.config.owner) {
		console.error("Invalid user ID set for 'owner' in config.json");
		process.exit();
	}
	process.stdout.write(`Logged in as ${client.user.tag}\n`);
});

client.login(client.config.token).catch(() => {
	console.error("Invalid bot token provided in config.json");
	process.exit();
});
