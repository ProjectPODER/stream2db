## data format conversion

You can drop converters in this folder. Just export a function that returns the
object in the format that you want. And then provide the name of the file with
your function on the command line with the `--converter` option.

We have provided an example in [ocds.js](./ocds.js). You can run it with
`stream2db --converter ocds [...other args...]`.
