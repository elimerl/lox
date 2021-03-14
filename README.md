# lox

An implementation of [Lox](https://craftinginterpreters.com/the-lox-language.html) in TypeScript.

## Usage

Clone the repo and run src/cli.ts (not done yet).

## Testing

To run the test suite, clone [this repository](https://github.com/munificent/craftinginterpreters), and run something like this:

<!---
I should change from `chap08_statements` to whatever I'm on. Future me problem!
-->

```sh
$ (cd tool && dart pub get)
$ dart ./tool/bin/test.dart chap08_statements  --interpreter "node" --arguments '../lox/lib/test'
```

For some reason you have to be in the craftinginterpreters directory.
