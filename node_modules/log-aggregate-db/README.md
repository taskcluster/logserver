log-aggregate-db
================

Append only database suited for building up a log file to send off to S3


## Development

The current log db requires postgres and node. There is a vagrant
environment provided to make this easy.

## Updating Vagrant

[Berkshelf](http://berkshelf.com/index.html) is awesome particularly
since we can use it to download the deps into "cookbooks" and check
those in so its easy to get start without berkshelf / bundler around.

To update the cookbooks though you should update the Berksfile and run
make cookbooks.
