# API용 ALB 인증서 — 서울 리전 와일드카드 1장 (스펙 §1). Ingress가 호스트명으로 자동 탐색한다.
# (CloudFront용 인증서는 us-east-1에 별도 — static-site.tf)
resource "aws_acm_certificate" "api" {
  domain_name       = "*.${local.domain}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

locals {
  # for_each 키는 plan 시점에 알 수 있어야 하므로 도메인명을 정적 키로 사용 (static-site.tf와 같은 방식)
  api_cert_validation = {
    for dvo in aws_acm_certificate.api.domain_validation_options : dvo.domain_name => dvo
  }
}

resource "aws_route53_record" "api_cert_validation" {
  for_each = toset(["*.${local.domain}"])

  zone_id = aws_route53_zone.main.zone_id
  name    = local.api_cert_validation[each.value].resource_record_name
  type    = local.api_cert_validation[each.value].resource_record_type
  records = [local.api_cert_validation[each.value].resource_record_value]
  ttl     = 300
  # 와일드카드의 검증 CNAME은 apex 인증서(static-site.tf)의 것과 같은 레코드다
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "api" {
  certificate_arn         = aws_acm_certificate.api.arn
  validation_record_fqdns = [for r in aws_route53_record.api_cert_validation : r.fqdn]
}

# ALB는 Ingress를 보고 AWS Load Balancer Controller가 만든다(이름은 Ingress 주석으로 고정).
# Terraform은 조회만 해서 DNS를 건다 — staging/prod가 같은 ALB를 공유하므로 호스트만 추가하면 된다.
data "aws_lb" "api" {
  name = "lunote"
}

resource "aws_route53_record" "api" {
  # api: prod API. api-staging: staging API. ci-hooks: Jenkins 웹훅 수신 경로
  # (경로·발신 IP 제한은 Ingress — infra/k8s/platform/namespaces/jenkins-webhook.yaml)
  for_each = toset(["api", "api-staging", "ci-hooks"])

  zone_id = aws_route53_zone.main.zone_id
  name    = "${each.key}.${local.domain}"
  type    = "A"

  alias {
    name                   = data.aws_lb.api.dns_name
    zone_id                = data.aws_lb.api.zone_id
    evaluate_target_health = true
  }
}
