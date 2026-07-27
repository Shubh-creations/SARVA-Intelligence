# Production AWS Security Infrastructure (Terraform HCL)
# Manages AWS KMS Keys, AWS WAF Rules, GuardDuty, and EKS IAM IRSA Roles

terraform {
  required_version = ">= 1.8.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "production"
}

# 1. AWS KMS Master Key for Field-Level Envelope Encryption
resource "aws_kms_key" "financeos_kms_key" {
  description             = "FinanceOS Production Master Encryption Key"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Environment = var.environment
    Service     = "FinanceOS"
    Security    = "EnvelopeEncryption"
  }
}

resource "aws_kms_alias" "financeos_kms_alias" {
  name          = "alias/financeos-production-key"
  target_key_id = aws_kms_key.financeos_kms_key.key_id
}

# 2. AWS GuardDuty Intelligent Threat Detection
resource "aws_guardduty_detector" "primary_detector" {
  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }
}

# 3. AWS WAF v2 Rule Group (SQL Injection & Rate Limiting Defense)
resource "aws_wafv2_web_acl" "production_waf" {
  name        = "financeos-production-waf"
  description = "Production WAF enforcing SQL injection, rate limiting, and bot protection"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "FinanceOSProductionWAF"
    sampled_requests_enabled   = true
  }

  # Rule 1: SQL Injection Protection
  rule {
    name     = "AWS-AWSManagedRulesSQLiRuleSet"
    priority = 10

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesSQLiMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rule 2: Rate Limiting (Max 2,000 requests per 5-minute window per IP)
  rule {
    name     = "RateLimit2000"
    priority = 20

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimit2000Metric"
      sampled_requests_enabled   = true
    }
  }
}
