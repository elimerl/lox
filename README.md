# lox

An implementation of [Lox](https://craftinginterpreters.com/the-lox-language.html) in TypeScript.

## Usage

Clone the repo and install dependencies:

```sh
git clone https://github.com/elimerl/lox
cd lox
yarn install # npm also works
```

Then run `src/cli.ts` to be dropped into a REPL.

## Testing

To run the test suite, clone [this repository](https://github.com/munificent/craftinginterpreters), and run something like this:

```sh
$ (cd tool && dart pub get)
$ dart ./tool/bin/test.dart chap08_statements  --interpreter "node" --arguments '../lox/lib/test'
```

For some reason you have to be in the craftinginterpreters directory.
