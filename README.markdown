# Stream2db

Redirect a data source to database. `Stream2db` expects to receive JSON objects
from the stream. Currently we support `mongodb` and `elasticsearch`. More
backends could be added easily using the [node etl driver](https://github.com/ZJONSSON/node-etl).

The intention of this module is to [stream compranet data](http://gitlab.rindecuentas.org/equipo-qqw/ellison) to a database, but it
could be adapted to handle other data sources.

As we are targeting local data managment, we have not yet added authorization.

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
