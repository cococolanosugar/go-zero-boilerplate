variable "db_url" {
  type    = string
  default = "mysql://root:root@127.0.0.1:3306/go_zero_boilerplate"
}

env "local" {
  url = var.db_url
  migration {
    dir = "file://manifest/sql/migrations"
  }
  format {
    migrate {
      diff = "{{ sql . \"  \" }}"
    }
  }
}
