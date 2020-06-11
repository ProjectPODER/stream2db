# Stream2db

Stream json documents or a csv file to a backend.
Currently we support `mongodb` and `elasticsearch`. More
backends could be added easily using the [node etl driver](https://github.com/ZJONSSON/node-etl).

## install

### Desde github (versión vieja)
    npm install -g git+https://git@github.com:kyv/stream2db.git

### Desde gitlab (versión actual)
    sudo npm install -g git+http://gitlab.rindecuentas.org/equipo-qqw/stream2db.git

## Examples

### Import compranet from streaming source to elasticsearch.

Since [ellison](https://github.com/kyv/ellison) hashes documents before sending them over the wire, those streams will get checked for data corruption.

    stream2db https://excel2json.herokuapp.com/https://compranetinfo.funcionpublica.gob.mx/descargas/cnet/Contratos2013.zip

### Use *CODIGO_CONTRATO* as _id

If you do not provide an *ID* field (`--id`) a random *ID* will be generated. If you do set the *ID* new documents with the same *ID* will replace their predecessors.

    stream2db -i CODIGO_CONTRATO https://excel2json.herokuapp.com/https://compranetinfo.funcionpublica.gob.mx/descargas/cnet/Contratos2013.zip

### Import CSV into *cargografias* index on elasticsearch

You can use a csv file as your data source.

    stream2db -d cargografias ~/Downloads/Cargografias\ v5\ -\ Nuevos_Datos_CHEQUEATON.csv

## Options

You can set some options on the commandline.

    stream2db -h|--help
    --backend DATA BACKEND   Backend to save data to. [mongo|elastic]
    --db INDEX|DB            Name of the index (elastic) or database (mongo) where data is written
    --type TYPE|COLLECTION   Mapping type (elastic) or collection (mongo).
    --id ID                  Specify a field to be used as _id. If hash is specified the object hash will be used
    --uris URIS              Space separated list of urls to stream
    --host HOST              Host to stream to. Default is localhost
    --port PORT              Port to stream to. Defaults to 9500 (elastic) or 27017 (mongo)
    --converter JAVASCRIPT MODULE   Pass data trough some predefined conversion function
    --help                   Print this usage guide.

## Debugging

The `--verbose` flag triggers debugging mode of the DB driver. In elasticsearch this is set to `log: trace`. The mongo driver allows for configuration by way of [variables in the enviornment](https://automattic.github.io/monk/docs/Debugging.html).

For testing this is the recommended setup:
* You need a JSON file to send via stdin, these should be the outputs of ocds_transformer
* Run the following command:
```
cat ${CONTRACTS_JSON_FILE} | node --prof --inspect ./bin/app.js --verbose --backend mongo --db poppins --type test_stream2db --id hash --host ${MONGO_USERPASS}@${MONGO_HOST} --port ${MONGO_PORT}
```

* To profile memory during run, you can take a snapshot using Chromium from the `chrome://inspect` url
* To profile execution time you can process the profiling files using this command: `node --prof-process [profile.log]`

## conversion

You can add arbitrary data conversion using by exporting a default function from some file in the `converters` directory and passing the name of that file with the option `--converter`. A conversion to OCDS has been added as an example. To use it you would add `--converter ocds` to your commandline.

## Notes

As we are targeting local data management, we have not yet added DB authorization. This will get added to the parameters.

## Cleanup

strings are [normalized](https://www.npmjs.com/package/normalize-space) and [trimmed](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/trim).

### Type coercion

We do very simple type coercion. Numbers should work. Anything else you want to do can be easily implemented with a converter.

### Hashes

We add the field `hash` to the indexed document. You can use it however you like.

### k8s

We produce [a docker image](https://hub.docker.com/r/poder/stream2db/) which you can use with the *CronJob.yaml files found here to run this code as a cronJob on kubernetes.
