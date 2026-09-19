# @jvavscratch/cli

The `jvavscratch` command: scaffolds projects, compiles them to `.sb3`, and talks
to the package registry.

## Install

Not published to npm — install it from GitHub:

```bash
npm install -g github:Jvavscratch/cli
```

npm resolves the `@jvavscratch/*` dependencies the same way and builds each one
on install.

## Commands

```bash
jvavscratch new [name] [path]   # scaffold a project
jvavscratch init                # scaffold in the current directory
jvavscratch build [path]        # compile -> target/<name>.sb3   (-o for the alpha optimiser)
jvavscratch run [path]          # build, then open in TurboWarp (Windows unless --bypass)
jvavscratch decompile <sb3>     # SB3 -> jvavscratch project
jvavscratch lib [name] [path]   # scaffold a compiler-extension package

jvavscratch add | remove | update | search | publish
jvavscratch login | register | registry <set-url|get-url|set-token|logout>
```

Run `jvavscratch --help` for the full list.

## A minimal session

```bash
jvavscratch new my-first-project
cd my-first-project
jvavscratch build
# -> target/my-first-project.sb3
```

## Configuration

Login state and the registry URL live in `~/.jvavscratch/config.json`
(`registry`, `api_token`, `username`), managed through
`jvavscratch registry` and `jvavscratch login`. The default registry is
`http://localhost:3000`.

## Note on the environment

`build` requires the project's `lib/` directory to exist (an empty directory is
fine) and `assets/stage/` to be present. Each build runs in its own temporary
directory under the system temp dir and cleans up after itself, so builds do not
interfere with each other and nothing is written into this package's install
directory.

## Documentation

- <https://jvavscratch.github.io/docs/guide/getting-started>
- <https://jvavscratch.github.io/docs/modules/cli>

## License

MPL-2.0
