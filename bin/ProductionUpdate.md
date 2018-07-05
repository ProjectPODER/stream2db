# Flow

We organize COMPRANET import and updates into 2 separate idempotent jobs scheduled independently. This separation allows us to avoid unnecessary complications caused by the division of single source documents into multiple collections. The names given here are just to be able to distinguish one from the other, they may change.

  1. cnet2collection
  2. cnetCollection2ocds

## cnet2collection

A bash script calls stream2db with the option `--id hash`. This streams data from compranet to mongodb and forces the use of the object hash as the id of the inserted document. If a document already exists with the same id, the document is skipped before any processing occurs. We log to the shell the number of documents inserted and skipped so the user may have an idea of progress and of changes which have occured between updates.

## cnetCollection2ocds

A nodejs script which loops over all documents in the `compranet` collection having a
`NUMERO_PROCEDIMIENTO` field. Each unique `NUMERO_PROCEDIMIENTO` is inserted as
a new document in OCDS release format. Any subsequent repetitions of a given `NUMERO_PROCEDIMIENTO` will update the `source`, `parties`, `awards` and `contracts`
arrays of the original. Once a given document from the `compranet` collection is
converted to an `OCDS` release and moved to the `ocds` collection, the data from the original document in the `compranet` collection is removed leaving only the hash. This way we reduce the disk space occupied by the data but also the next run of `cnet2collection` will skip over those documents already imported.

## Observations

The fact that these two jobs are idempotent means that we can run them independently in or out of sequence without consequence. If one day for some reason the first job fails to run, then the second will simply scan the data and do nothing. If for instance the first job runs twice in row and compranet has not changed, then it will do nothing. If, however, compranet, has changed, then only those changed documents will be processed, any content we have not seen will go unchanged. It is worth note, also, that the script to convert from compranet to OCDS is rather simply, and it is a simple task to expand it to do further operations. It is also trivial to create new jobs using it as a template which perform other tasks.
