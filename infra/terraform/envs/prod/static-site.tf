# lunoteapp.com 정적 랜딩 페이지 (S3 + CloudFront + ACM + Route 53)
# 스토어 조직 등록 심사·개인정보 처리방침 게시용 공식 웹사이트.

locals {
  domain = "lunoteapp.com"
  # apex와 www 모두 서빙
  site_aliases = [local.domain, "www.${local.domain}"]
}

data "aws_caller_identity" "current" {}

# --- Route 53 ---
# 도메인 구매 시 자동 생성된 zone을 import해서 관리 (comment는 기존 값 유지)
resource "aws_route53_zone" "main" {
  name    = local.domain
  comment = "HostedZone created by Route53 Registrar"
}

# --- ACM (CloudFront 요구사항으로 us-east-1) ---
resource "aws_acm_certificate" "site" {
  provider                  = aws.us_east_1
  domain_name               = local.domain
  subject_alternative_names = ["www.${local.domain}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

locals {
  # for_each 키는 plan 시점에 알 수 있어야 하므로 도메인명을 정적 키로 사용
  cert_validation = {
    for dvo in aws_acm_certificate.site.domain_validation_options : dvo.domain_name => dvo
  }
}

resource "aws_route53_record" "site_cert_validation" {
  for_each = toset(local.site_aliases)

  zone_id         = aws_route53_zone.main.zone_id
  name            = local.cert_validation[each.value].resource_record_name
  type            = local.cert_validation[each.value].resource_record_type
  records         = [local.cert_validation[each.value].resource_record_value]
  ttl             = 300
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "site" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for r in aws_route53_record.site_cert_validation : r.fqdn]
}

# --- S3 (비공개, CloudFront OAC로만 접근) ---
resource "aws_s3_bucket" "site" {
  bucket = "lunote-static-site-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontOAC"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.site.arn}/*"
      Condition = {
        StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.site.arn }
      }
    }]
  })
}

locals {
  # site/ 아래 전체를 업로드한다 (index + 법적 문서 4개 + 공용 CSS)
  site_files = fileset("${path.module}/site", "**")
  site_content_types = {
    html = "text/html; charset=utf-8"
    css  = "text/css; charset=utf-8"
  }
}

moved {
  from = aws_s3_object.index
  to   = aws_s3_object.site["index.html"]
}

resource "aws_s3_object" "site" {
  for_each = local.site_files

  bucket       = aws_s3_bucket.site.id
  key          = each.value
  source       = "${path.module}/site/${each.value}"
  content_type = local.site_content_types[regex("[^.]+$", each.value)]
  etag         = filemd5("${path.module}/site/${each.value}")
}

# CachingOptimized가 HTML을 최대 24시간 캐시하므로 파일이 바뀌면 전체 무효화한다 (월 1,000건까지 무료).
# local-exec라 apply 셸에 AWS_PROFILE이 있어야 한다 (평소 apply 방식과 동일).
resource "terraform_data" "site_invalidation" {
  triggers_replace = [for f in local.site_files : filemd5("${path.module}/site/${f}")]

  provisioner "local-exec" {
    command = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.site.id} --paths '/*'"
  }

  depends_on = [aws_s3_object.site]
}

# --- CloudFront ---
resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "lunote-static-site"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# 확장자 없는 경로(/privacy, /delete-account)를 S3 객체 키(.html)로 바꾼다 — S3 REST 원본은 디렉터리 인덱스를 모른다.
resource "aws_cloudfront_function" "site_rewrite" {
  name    = "lunote-site-html-rewrite"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-JS
    function handler(event) {
      var request = event.request;
      var uri = request.uri;
      if (uri.endsWith('/')) {
        request.uri = uri === '/' ? '/index.html' : uri.slice(0, -1) + '.html';
      } else if (!uri.includes('.')) {
        request.uri = uri + '.html';
      }
      return request;
    }
  JS
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  comment             = "lunoteapp.com static site"
  default_root_object = "index.html"
  aliases             = local.site_aliases
  price_class         = "PriceClass_200" # 한국 포함 아시아 엣지 사용

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "s3-site"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-site"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    # AWS 관리형 CachingOptimized 정책
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.site_rewrite.arn
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.site.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}

# --- 사이트 DNS (apex + www, IPv4/IPv6) ---
resource "aws_route53_record" "site_a" {
  for_each = toset(local.site_aliases)

  zone_id = aws_route53_zone.main.zone_id
  name    = each.value
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "site_aaaa" {
  for_each = toset(local.site_aliases)

  zone_id = aws_route53_zone.main.zone_id
  name    = each.value
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

# --- 이메일 수신 (ImprovMX 포워딩: contact@lunoteapp.com) ---
resource "aws_route53_record" "mx" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.domain
  type    = "MX"
  ttl     = 3600
  records = [
    "10 mx1.improvmx.com",
    "20 mx2.improvmx.com",
  ]
}

moved {
  from = aws_route53_record.spf
  to   = aws_route53_record.apex_txt
}

# apex TXT는 레코드 세트 하나에 값을 모아야 함 (SPF + 각종 도메인 소유권 확인)
resource "aws_route53_record" "apex_txt" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.domain
  type    = "TXT"
  ttl     = 3600
  records = [
    "v=spf1 include:spf.improvmx.com ~all",
    "google-site-verification=-L2k8Mm6RSslUp7N82-zj7xMX2j-ZzQDKKe3byzKdnA",
    "brevo-code:24668a1c0fc9c662f2cd2815bb8d3f5c", # Brevo 도메인 소유 확인 (2026-10-06)
  ]
}

# Brevo(앱 메일 발송) 도메인 인증 — 2026-10-06. DKIM 2개는 From(noreply@lunoteapp.com)과 정렬돼 DMARC를 통과시키고,
# mail.* 3개는 branded subdomain(반송 주소·링크/이미지 추적)이라 수신 측에 보이는 도메인이 전부 lunoteapp.com이 된다.
# SPF는 반송 주소(mail.lunoteapp.com)에 대해 평가되므로 apex SPF에 Brevo를 넣지 않는다(CNAME 대상이 제공).
resource "aws_route53_record" "brevo" {
  for_each = {
    "brevo1._domainkey" = "b1.lunoteapp-com.dkim.brevo.com"
    "brevo2._domainkey" = "b2.lunoteapp-com.dkim.brevo.com"
    "mail"              = "mail-lunoteapp-com.brand.brevosend.com"
    "r.mail"            = "mail-lunoteapp-com.r.brand.brevosend.com"
    "img.mail"          = "mail-lunoteapp-com.img.brand.brevosend.com"
  }

  zone_id = aws_route53_zone.main.zone_id
  name    = "${each.key}.${local.domain}"
  type    = "CNAME"
  ttl     = 3600
  records = [each.value]
}

# DMARC — 이 도메인을 발신자로 위조한 메일을 수신 측이 거부하게 한다 (2026-10-04, 주소 도용 스팸 대응).
# 앱 메일은 Brevo가 위 DKIM으로 이 도메인에 정렬 서명하므로 reject를 유지한다(Brevo가 제안하는 p=none보다 강함).
resource "aws_route53_record" "dmarc" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "_dmarc.${local.domain}"
  type    = "TXT"
  ttl     = 3600
  records = ["v=DMARC1; p=reject; sp=reject"]
}
