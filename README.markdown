# Stream2db

Stream json documents or a csv file to a backend.
Currently we support `mongodb` and `elasticsearch`. More
backends could be added easily using the [node etl driver](https://github.com/ZJONSSON/node-etl).

We have a focus on [compranet data](http://gitlab.rindecuentas.org/equipo-qqw/ellison) but
some work has been done to handle other data sources.

As we are targeting local data managment, we have not yet added DB authorization. We assume localhost

## Examples

### Import compranet from streaming source to elasticsearch.

    node app.js https://excel2json.herokuapp.com/https://compranetinfo.funcionpublica.gob.mx/descargas/cnet/Contratos2013.zip

### Use *CODIGO_CONTRATO* as _id

    node app.js -i CODIGO_CONTRATO https://excel2json.herokuapp.com/https://compranetinfo.funcionpublica.gob.mx/descargas/cnet/Contratos2013.zip

### Import CSV into *cargografias* index on elasticsearch

    node app.js -d cargografias ~/Downloads/Cargografias\ v5\ -\ Nuevos_Datos_CHEQUEATON.csv

## Options

You can set some options on the commandline.

    node app.js -h|--help

    --backend DB   Backend to save data to. [mongo|elastic]
    --db INDEX     Name of the database, index where data is written.
    --id ID        Supply a field to be used as _id field.
    --uris URIS    Space seperated list of urls to stream
    --help         Print this usage guide.

## Notes

### Type coercion

We do very simple type coercion. Numbers should work.

elasticsearch indexes (processes) data as it is inserted. So data types must be set in the mapping before data is inserted. It has dynamic types which will try to detect types (numbers, dates, etc) but the format of the data must conform to what is expected.

In mongodb we can create the index after the data is inserted, so that is up to you.

### duplicates

We detect and dismiss duplicates using [object-hash](https://github.com/puleos/object-hash)

### IDs

If you do not provide an *ID* field (`--id`) a random *ID* will be generated. If you do set the *ID* new documents with the same *ID* will replace their predecessors.
