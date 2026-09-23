terraform {
  required_version = ">= 1.11"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-2"
  default_tags {
    tags = {
      Project   = "lunote"
      ManagedBy = "terraform"
      Stack     = "prod"
    }
  }
}

# CloudFront용 ACM 인증서는 us-east-1에만 발급 가능
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  default_tags {
    tags = {
      Project   = "lunote"
      ManagedBy = "terraform"
      Stack     = "prod"
    }
  }
}
