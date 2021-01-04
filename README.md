# NTCW (Node Terraform CLI Wrapper)

![App license](https://img.shields.io/github/license/Naereen/StrapDown.js.svg)
![App version](https://img.shields.io/badge/version-1.0.2-blue.svg)

A Node.js wrapper for Terraform's command line interface.

`ntcw` runs the `terraform` CLI commands isolated via Node's `child_process`, thus why changing the environment variable `TF_LOG`, according to the debug log level, won't affect the environment variable you've set up for your main terminal session.

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
npm i -g ntcw
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
    "ntcw": "src/index.js"
  }
}
```

Clone the repo and install the dependencies
```
git clone git@github.com:bulletinmybeard/ntcw.git \
    && cd ntcw \
    && npm install
```

Use `npm link` to create the symlink to the script
```
npm link
```

Use `npm unlink` to remove the symlink to the script
```
npm unlink \
    ntcw
```

Make sure the binary symlink is gone for good!
```
rm -rf \
    /usr/local/bin/tf
```

```
Before: node ./src/index.js validate
After: ntcw validate
```

### Requirements
[^TOC](#toc)

The script has been fully tested with the Terraform CLI in version `0.12.29` and Node.js in version `13.13.0`. Mind you, Terraform CLI versions above `0.12.29` might won't work! 

### Dependencies
[^TOC](#toc)

I keep the source code as Vanilla as possible and only depend on a few Node core modules. However, the `package.json` contains the dev dependency `@types/node` for the IDE.

## Run the CLI wrapper

```
ntcw validate
```

### Directory watcher
[^TOC](#toc)

Running tthe CLI wrapper with the `watch` argument and without value will attach a watcher to the caller directory and triggers the given terraform command with all its arguments again whenever a change within the parent or nested directories was emitted.
Passing a directory path to the `watch` argument will overwrite the default working directory to the given argument value. 
Useful witth the terraform command `validate`!
```
// Without path
ntcw validate -watch

// With relative path
ntcw validate -watch=./terraform

// With absolute path
ntcw validate -watch=/usr/local/dev/projects/terraform
```
### Examples
[^TOC](#toc)
```
ntcw version
ntcw init
ntcw plan -compact-warnings
ntcw apply -error
ntcw apply -auto (-auto-approve)
ntcw validate -watch -trace
ntcw plan --help
...
```

### Argument abbreviations
[^TOC](#toc)

For most of the terraform commands exists a short form of the name (e.g., `ntcw plan -destroy`). The argument `auto-approve` got the alias `auto`.

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
ntcw p -compact-warnings
ntcw a -error
ntcw a -auto (-auto-approve)
ntcw v -watch -trace
ntcw p --help
ntcw a -auto
...
```

### Debugging
[^TOC](#toc)

Debugging is done by passing one of the five supported arguments from below. The arguments represent the log levels for the environment variable `TF_LOG` (e.g., `TF_LOG="trace"`).

```
ntcw validate -trace
ntcw validate -debug
ntcw validate -info
ntcw validate -warning
ntcw validate -error
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
