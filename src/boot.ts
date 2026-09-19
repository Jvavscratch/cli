/*******************************************************************
* Copyright         : 2024 saaawdust
* File Name         : boot.ts
* Description       : Bootstraps the jvavscratch environment
*
* Revision History  :
* Date        Author          Comments
* ------------------------------------------------------------------
* 10/12/2025  NeuronPulse     Modified
/******************************************************************/

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { addDep, buildProject, createPackage, createProject, decompileFromSB3, removeDep, runProject, updateDep, publishPackage, searchPackages, ProjectError } from "./cli/projectManager";
import { login, register } from "./cli/registry";
import { setApiToken, setRegistryUrl, getRegistryUrl, clearAuth, setConfig } from "./cli/config";
import { cwd } from "process";
import { basename, join, resolve } from "path";
import chalk from 'chalk';
import { existsSync } from 'fs';

function parseStrings(...args: any) {
    return args.map((str: any) => {
        const [name, version] = str.split('@');

        const versionIsValid = version && (/^(\d+\.)?(\d+\.)?(\d+)$/.test(version) || version === 'latest');

        return {
            name: name,
            version: versionIsValid ? (version === 'latest' ? "*" : version) : "*"
        };
    });
}

function handleCommand(handler: (argv: any) => Promise<void> | void) {
    return async (argv: any) => {
        try {
            await handler(argv);
        } catch (e) {
            if (e instanceof ProjectError) {
                console.error(chalk.red("error: ") + e.message);
            } else if (e instanceof Error) {
                console.error(chalk.red("error: ") + e.message);
            } else {
                console.error(chalk.red("error: "), e);
            }
            process.exit(1);
        }
    };
}

yargs(hideBin(process.argv))
    .scriptName("jvavscratch")
    .usage('$0 <cmd> [args]')

    .command(
          'new [name] [path]',
         'Creates a new project for jvavscratch. No longer bundles with configuration files.\n',
        (yargs) => {
            return yargs
                .positional('name', {
                    type: 'string',
                    default: 'my-project',
                    describe: 'The name of the project'
                })
                .positional('path', {
                    type: 'string',
                    default: './',
                    describe: 'The path to create the project'
                });
        },
        handleCommand((argv) => {
            return createProject(argv.name, argv.path);
        })
    )

    .command(
        'init',
        'Creates a new project in the current-working-directory',
        () => { },
        handleCommand((argv) => {
            let wd = cwd();
            return createProject(basename(wd), ".");
        })
    )

    .command(
        'build [path]',
        'Builds the current project in the current-working-directory, or in the provided one',
        (yargs) => {
            return yargs.positional('path', {
                type: 'string',
                default: './',
                describe: 'Path to the `jvavscratch` project'
            });
        },
        handleCommand(async (argv) => {
            let resolved = resolve(argv.path);
            return await buildProject(argv, resolved, basename(resolved));
        })
    )

    .command(
        'run [path]',
        'Builds and runs the current project in the current-working-directory, or in the provided one, in TurboWarp',
        (yargs) => {
            return yargs.positional('path', {
                type: 'string',
                default: './',
                describe: 'Path to the `jvavscratch` project'
            });
        },
        handleCommand(async (argv) => {
            if (process.platform != "win32" && !argv.bypass) {
                console.error("The `run` command automatically opens TurboWarp, which is only pre-configured for Windows.");
                console.error("Use `jvavscratch build` to compile the project, then open the .sb3 manually.");
                console.error("Or use --bypass if you have TurboWarp installed elsewhere.");
                return;
            }
            let resolved = resolve(argv.path);
            return await runProject(argv, resolved, basename(resolved));
        })
    )
    .command(
        'decompile <sb3Path> [outputDir] [projectName]',
        'Decompiles an SB3 file into a jvavscratch project',
        (yargs) => {
            return yargs
                .positional('sb3Path', {
                    type: 'string',
                    describe: 'Path to the SB3 file to decompile'
                })
                .positional('outputDir', {
                    type: 'string',
                    default: './',
                    describe: 'Directory to create the jvavscratch project in'
                })
                .positional('projectName', {
                    type: 'string',
                    describe: 'Name for the decompiled project (optional)'
                });
        },
        handleCommand(async (argv) => {
            if (!argv.sb3Path) {
                console.error("error: please provide a path to an SB3 file");
                return;
            }
            await decompileFromSB3(argv.sb3Path, argv.outputDir, argv.projectName);
        })
    )

    .command(
          'lib [name] [path]',
         'Creates a new package for jvavscratch. No longer bundles with configuration files.\n',
        (yargs) => {
            return yargs
                .positional('name', {
                    type: 'string',
                    default: 'my-package',
                    describe: 'The name of the package'
                })
                .positional('path', {
                    type: 'string',
                    default: './',
                    describe: 'The path to create the package'
                });
        },
        handleCommand((argv) => {
            return createPackage(argv.name, argv.path);
        })
    )
    .command(
        'add [libs...]',
        'Adds a new dependency to the project in the current-working-directory.',
        (yargs) => {
            return yargs
                .positional('libs', {
                    describe: 'The libraries to include (name@version)',
                    type: 'string',
                    array: true
                });
        },
        handleCommand(async (argv) => {
            const parsedLibs = parseStrings(...(argv.libs as any));
            await addDep(parsedLibs);
        })
    )

    .command(
        'remove [libs...]',
        'Removes the given packages in the project that is in the current-working-directory.',
        (yargs) => {
            return yargs
                .positional('libs', {
                    describe: 'The libraries to remove (name)',
                    type: 'string',
                    array: true
                });
        },
        handleCommand(async (argv) => {
            let libs = argv.libs;
            let libsFolder = join(cwd(), "lib");

            if (!existsSync(libsFolder)) {
                console.error(chalk.red("error: ") + "there are no dependencies to remove");
                return;
            };

            return removeDep(libsFolder, (libs as any));
        })
    )

    .command(
          'update',
         'Updates dependencies in the project.\n',
        (yargs) => {},
        handleCommand(async (argv) => {
            let libsFolder = join(cwd(), "lib");

            if (!existsSync(libsFolder)) {
                console.error(chalk.red("error: ") + "there are no dependencies to update");
                return;
            };

            if (!existsSync(join(cwd(), "jvavscratch.toml"))) {
                console.error(chalk.red("error: ") + "no 'jvavscratch.toml' could be found");
                return;
            }

            return updateDep(libsFolder, join(cwd(), "jvavscratch.toml"));
        })
    )

    .command(
        'search <query>',
        'Search for packages in the registry.',
        (yargs) => {
            return yargs.positional('query', {
                type: 'string',
                describe: 'Search query'
            });
        },
        handleCommand(async (argv) => {
            await searchPackages(argv.query);
        })
    )

    .command(
        'publish',
        'Publishes the current package to the registry.',
        (yargs) => {},
        handleCommand(async (argv) => {
            await publishPackage();
        })
    )

    .command(
        'login',
        'Log in to the jvavscratch registry.',
        (yargs) => {},
        handleCommand(async (argv) => {
            const readline = require('readline');
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

            const question = (prompt: string): Promise<string> => new Promise(resolve => rl.question(prompt, resolve));

            console.log(chalk.blue("[INFO]") + ` Logging in to ${getRegistryUrl()}`);
            const username = await question('Username: ');
            const password = await question('Password: ');
            rl.close();

            const result = await login(username, password);
            setApiToken(result.api_token);
            setConfig({ username });
            console.log(chalk.green("[OK]") + " Logged in successfully.");
        })
    )

    .command(
        'register',
        'Register a new account on the jvavscratch registry.',
        (yargs) => {},
        handleCommand(async (argv) => {
            const readline = require('readline');
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

            const question = (prompt: string): Promise<string> => new Promise(resolve => rl.question(prompt, resolve));

            console.log(chalk.blue("[INFO]") + ` Registering on ${getRegistryUrl()}`);
            const username = await question('Username: ');
            const email = await question('Email: ');
            const password = await question('Password: ');
            rl.close();

            const result = await register(username, email, password);
            setApiToken(result.api_token);
            setConfig({ username });
            console.log(chalk.green("[OK]") + " Account created and logged in successfully.");
        })
    )

    .command(
        'registry <subcommand> [value]',
        'Manage registry settings.',
        (yargs) => {
            return yargs
                .positional('subcommand', {
                    type: 'string',
                    describe: 'set-url, get-url, set-token, or logout'
                })
                .positional('value', {
                    type: 'string',
                    describe: 'Value for set-url or set-token'
                });
        },
        handleCommand(async (argv) => {
            switch (argv.subcommand) {
                case 'set-url':
                    if (!argv.value) {
                        console.error(chalk.red("error: ") + "URL is required");
                        return;
                    }
                    setRegistryUrl(argv.value);
                    console.log(chalk.green("[OK]") + ` Registry URL set to ${argv.value}`);
                    break;
                case 'get-url':
                    console.log(getRegistryUrl());
                    break;
                case 'set-token':
                    if (!argv.value) {
                        console.error(chalk.red("error: ") + "Token is required");
                        return;
                    }
                    setApiToken(argv.value);
                    console.log(chalk.green("[OK]") + " API token set");
                    break;
                case 'logout':
                    clearAuth();
                    console.log(chalk.green("[OK]") + " Logged out");
                    break;
                default:
                    console.error(chalk.red("error: ") + "Unknown subcommand. Use: set-url, get-url, set-token, logout");
            }
        })
    )

    .option('bypass', {
        alias: 'b',
        type: 'boolean',
        description: 'Bypass the TurboWarp platform check on `run`. May cause errors.'
    })

    .option('optimize', {
        alias: 'o',
        type: 'boolean',
        description: 'Whether to compile an optimized build or not',
    })

    // Parse the command line arguments
    .version()
    .alias('version', 'v')
    .help()
    .alias('help', 'h')
    .demandCommand(1, chalk.red("error: ") + "invalid usage; see above ^") // Enforce command input
    .argv;