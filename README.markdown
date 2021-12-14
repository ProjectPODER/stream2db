# stream2db

Stream json documents to a backend. Currently we support `mongodb` and `elasticsearch`.

## Usage

This script receives a stream of JSON objects, one object per line, from stdin.

    cat JSON_LINES | node bin/app.js OPTIONS

Use the available options to control where to send the documents and how insertion happens.

## Options

You can set some options on the commandline.

    --verbose       -v      Verbose output to see document processing in real time.
    --backend       -b      Backend to save data to. [mongo|elastic]
    --db            -d      Name of the index (elastic) or database (mongo).
    --type          -t      Collection (mongo). No effect on elastic.
    --host          -h      Host to stream to. Default is localhost.
    --port          -p      Port to stream to. Defaults to 9200 (elastic) or 27017 (mongo).
    --user          -u      Username for authentication.
    --pass          -w      Password for authentication.
    --id            -i      Specify a field to be used as id. Set to hash to use object hash as id.
    --extended      -x      Use extended dynamic mapping options for elastic.
    --help          -h      Print this usage guide.

## Backend details

### mongo

Before attempting to insert a document to a Mongo backend, stream2db performs a simple query to check if a document with the same id field already exists. When using object hashes as ids, this causes stream2db to insert only new documents and avoid insertion errors.

### elastic

The provided backend process for Elasticsearch uses dynamic mapping types to avoid common mapping errors caused by inconsistent data. The following templates are automatically applied:

- **Strings**: set mapping type to text and automatically generate a keyword field when string is shorter than 512 characters.
- **Amounts**: when field name contains the word *amount* it is automatically mapped to float.
- **Names**: when field name contains the word *name* it is automatically mapped to string.

An optional extended dynamic mapping is also available using the -x command line option. This converts any numeric data type to float.
