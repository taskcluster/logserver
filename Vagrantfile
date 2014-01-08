# -*- mode: ruby -*-
# vi: set ft=ruby :
POSTGRES_PASS = 'vagrant';
POSTGRES_CONFIG = <<BASH
  export POSTGRES_TEST_URL=postgres://vagrant:#{POSTGRES_PASS}@127.0.0.1/vagrant_test
  export DATABASE_URL=postgres://vagrant:#{POSTGRES_PASS}@127.0.0.1/vagrant_dev
  export CLOUDAMQP_URL=amqp://guest:guest@127.0.0.1
BASH

Vagrant.configure("2") do |config|
  # All Vagrant configuration is done here. The most common configuration
  # options are documented and commented below. For a complete reference,
  # please see the online documentation at vagrantup.com.

  config.vm.hostname = "taskcluster-logserver"

  # Every Vagrant virtual environment requires a box to build off of.
  config.vm.box = "ubuntu-chef-12.04"

  # The url from where the 'config.vm.box' box will be fetched if it
  # doesn't already exist on the user's system.
  config.vm.box_url = "http://grahamc.com/vagrant/ubuntu-12.04-omnibus-chef.box"

  config.vm.provision :shell,
    inline: "echo '#{POSTGRES_CONFIG}' > /etc/profile.d/postgres.sh"

  config.vm.provision :chef_solo do |chef|
    chef.json = {
      postgresql: {
        password: {
          postgres: 'vagrant'
        },
        databases: [
          {
            name: 'vagrant_test',
            owner: 'vagrant'
          },
          {
            name: 'vagrant_dev',
            owner: 'vagrant'
          }
        ],
        users: [
          {
            username: 'vagrant',
            password: POSTGRES_PASS,
            superuser: true,
            createdb: true,
            login: true
          }
        ]
      }
    }

    chef.run_list = [
      "nodejs::install_from_binary",
      "postgresql::server",
      "postgresql::pg_user",
      "postgresql::pg_database",
      "recipe[rabbitmq]",
      "recipe[rabbitmq::mgmt_console]"
    ]
  end

  config.vm.provision :shell,
    inline: "cd /vagrant && ./bin/update_schema DATABASE_URL"
end
