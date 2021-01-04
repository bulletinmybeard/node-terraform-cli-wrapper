# node-terraform-cli-wrapper

![App license](https://img.shields.io/github/license/Naereen/StrapDown.js.svg)
![App version](https://img.shields.io/badge/version-1.0.0-blue.svg)

A Node.js wrapper for Terraform's command line interface.

`tf` runs the `terraform` CLI commands isolated via Node's `child_process`, thus why changing the environment variable `TF_LOG`, according to the debug log level, won't affect the environment variable you've set up for your main terminal session.

## TOC
- [Installation](#installation)
    - [Requirements](#requirements)
    - [Dependencies](#dependencies)
- [Run the CLI wrapper](#run-the-cli-wrapper)
    - [Directory watcher](#directory-watcher)
    - [Examples](#examples)
    - [Argument abbreviations](#argument-abbreviations)
    - [Debugging](#debugging)
- [References](#references)
- [TODO](#todo)

## Installation
[^TOC](#toc)

```
npm i -g node-terraform-cli
```

You can also clone this repository and use NPM to link and make the script globally available.
With a shebang in the `index.js` and the `bin` property in the `package.json`, this script is ready to go binary!

```
// Shebang
#!/usr/bin/env node

// Package.json binary def. tf
{
  ...
  "bin": {
    "tf": "src/index.js"
  }
}
```

Clone the repo and install the dependencies
```
git clone git@github.com:bulletinmybeard/node-terraform-cli.git \
    && cd node-terraform-cli \
    && npm install
```

Use `npm link` to create the symlink to the script
```
npm link
```

Use `npm unlink` to remove the symlink to the script
```
npm unlink \
    node-terraform-cli
```

Make sure the binary symlink is gone for good!
```
rm -rf \
    /usr/local/bin/tf
```

```
Before: node ./src/index.js validate
After: tf validate
```

### Requirements
[^TOC](#toc)

The script has been fully tested with the Terraform CLI in version `0.12.29` and Node.js in version `13.13.0`. Mind you, Terraform CLI versions above `0.12.29` might won't work! 

### Dependencies
[^TOC](#toc)

I keep the source code as Vanilla as possible and only depend on a few Node core modules. However, the `package.json` contains the dev dependency `@types/node` for the IDE.

## Run the CLI wrapper

```
tf validate
```

### Directory watcher
[^TOC](#toc)

Running tthe CLI wrapper with the `watch` argument and without value will attach a watcher to the caller directory and triggers the given terraform command with all its arguments again whenever a change within the parent or nested directories was emitted.
Passing a directory path to the `watch` argument will overwrite the default working directory to the given argument value. 
Useful witth the terraform command `validate`!
```
// Without path
tf validate -watch

// With relative path
tf validate -watch=./terraform

// With absolute path
tf validate -watch=/usr/local/dev/projects/terraform
```
### Examples
[^TOC](#toc)
```
tf version
tf init
tf plan -compact-warnings
tf apply -error
tf apply -auto (-auto-approve)
tf validate -watch -trace
tf plan --help
...
```

### Argument abbreviations
[^TOC](#toc)

For most of the terraform commands exists a short form of the name (e.g., `tf plan -destroy`). The argument `auto-approve` got the alias `auto`.

```
const SHORT_COMMAND_MAPPING = {
    a: 'apply',
    c: 'console',
    d: 'destroy',
    e: 'env',
    f: 'fmt',
    i: 'import',
    o: 'output',
    p: 'plan',
    r: 'refresh',
    s: 'show',
    t: 'taint',
    u: 'untaint',
    v: 'validate',
    w: 'workspace',
};

const SHORT_ARGUMENT_MAPPING = {
    auto: 'auto-approve',
};
```

```
tf p -compact-warnings
tf a -error
tf a -auto (-auto-approve)
tf v -watch -trace
tf p --help
tf a -auto
...
```

### Debugging
[^TOC](#toc)

Debugging is done by passing one of the five supported arguments from below. The arguments represent the log levels for the environment variable `TF_LOG` (e.g., `TF_LOG="trace"`).

```
tf validate -trace
tf validate -debug
tf validate -info
tf validate -warning
tf validate -error
```

# References
[^TOC](#toc)

- Terraform
    - https://www.terraform.io/downloads.html
    - https://www.terraform.io/docs/commands/index.html
    - https://www.terraform.io/docs/internals/debugging.html
- Node.js
    - https://nodejs.org/api/fs.html
    - https://nodejs.org/api/path.html
    - https://nodejs.org/api/util.html
    - https://nodejs.org/api/child_process.html
- NPM
    - https://docs.npmjs.com/cli/v6/commands/npm-link

# TODO
[^TOC](#toc)

- [ ] Refactor the watcher to use one or multiple glob patterns.
- [ ] Refactor the `execModule` and capture the stdout stream to replace all `terraform` command references with `tf`. 
 
