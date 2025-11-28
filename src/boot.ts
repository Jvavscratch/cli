/*******************************************************************
* Copyright         : 2024 saaawdust
* File Name         : boot.ts
* Description       : Bootstraps the jvavscratch environment
*                    
* Revision History  :
* Date		Author 			Comments
* ------------------------------------------------------------------
* 13/09/2024	saaawdust	Created file, setup environment
*
/******************************************************************/

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { addDep, buildProject, createPackage, createProject, decompileFromSB3, removeDep, runProject, updateDep } from "./cli/projectManager";
import { cwd } from "process";
import { basename, join, resolve } from "path";
// import { error } from "./cli/jvavscratchProject"; // 替换为自定义错误处理
const error = console.error;
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

yargs(hideBin(process.argv))
    .scriptName("node src/index.js")
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
        (argv) => {
            if (process.platform != "win32" && !argv.bypass) error("node src/index.js only works on the windows architecture.");

            return createProject(argv.name, argv.path);
        }
    )

    .command(
        'init',
        'Creates a new project in the current-working-directory',
        () => { },
        (argv) => {
            if (process.platform != "win32" && !argv.bypass) error("node src/index.js only works on the windows architecture.");

            let wd = cwd();
            return createProject(basename(wd), ".");
        }
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
        async (argv) => {
            if (process.platform != "win32" && !argv.bypass) error("node src/index.js only works on the windows architecture.");

            let resolved = resolve(argv.path);
            return await buildProject(argv, resolved, basename(resolved));
        }
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
        async (argv) => {
            if (process.platform != "win32" && !argv.bypass) error("node src/index.js only works on the windows architecture.");
            let resolved = resolve(argv.path);
            return await runProject(argv, resolved, basename(resolved));
        }
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
        async (argv) => {
            if (process.platform != "win32" && !argv.bypass) {
                console.error("node src/index.js only works on the windows architecture.");
                return;
            }
            
            try {
                await decompileFromSB3(argv.sb3Path, argv.outputDir, argv.projectName);
            } catch (error) {
                console.error("反编译失败:", error);
            }
        }
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
        (argv) => {
            if (process.platform != "win32" && !argv.bypass) error("node src/index.js only works on the windows architecture.");

            return createPackage(argv.name, argv.path);
        }
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
        async (argv) => {
            if (process.platform != "win32" && !argv.bypass) {
                console.error("node src/index.js only works on the windows architecture.");
                return;
            }

            const parsedLibs = parseStrings(...(argv.libs as any));
            await addDep(parsedLibs);
        }
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
        async (argv) => {
            if (process.platform != "win32" && !argv.bypass) {
                console.error("jvavscratch only works on the windows architecture.");
                return;
            }

            let libs = argv.libs;
            let libsFolder = join(cwd(), "lib");

            if (!existsSync(libsFolder)) {
                error("there are no dependencies to remove");
            };

            return removeDep(libsFolder, (libs as any));
        }
    )

    .command(
          'update',
         'Updates dependencies in the project.\n',
        (yargs) => {},
        async (argv) => {
            if (process.platform != "win32" && !argv.bypass) {
                console.error("jvavscratch only works on the windows architecture.");
                return;
            }

            let libs = argv.libs;
            let libsFolder = join(cwd(), "lib");

            if (!existsSync(libsFolder)) {
                error("there are no dependencies to remove");
            };

            if (!existsSync(join(cwd(), "jvavscratch.toml"))) {
        error("no 'jvavscratch.toml' could be found");
        return;
    }
    
    return updateDep(libsFolder, join(cwd(), "jvavscratch.toml"));
        }
    )

    .command(
        'publish',
        'Returns information on publishing a package.',
        (yargs) => { },
        (argv) => {
            // Format with links
            console.log(chalk.blue("[INFO]") +
                ": To publish a package; you need to submit a pull request "+
                "\u001b]8;;https://github.com/jvavscratch/jvavscratch-registry/pulls\u001b\\here\u001b]8;;\u001b\\" +
                ". More about publishing can be found " +
                "\u001b]8;;https://github.com/jvavscratch/jvavscratch-registry/blob/main/README.md\u001b\\here\u001b]8;;\u001b\\!");
        }
    )

    .option('bypass', {
        alias: 'b',
        type: 'boolean',
        description: 'Bypass the platform-block on jvavscratch. May cause errors.'
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
