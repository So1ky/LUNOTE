terraform {
  backend "s3" {
    bucket       = "lunote-tfstate-695019457880"
    key          = "prod/terraform.tfstate"
    region       = "ap-northeast-2"
    use_lockfile = true
  }
}
