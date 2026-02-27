# Flow AI Bot Pipeline - Step Functions State Machine

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/states/${var.project_name}-meeting-completion"
  retention_in_days = 30
}

resource "aws_sfn_state_machine" "meeting_completion" {
  name     = "${var.project_name}-meeting-completion"
  role_arn = aws_iam_role.step_functions.arn

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  definition = jsonencode({
    Comment = "Handles post-meeting processing: wait for chunks, generate notes"
    StartAt = "InitializeRetryCount"

    States = {
      InitializeRetryCount = {
        Type = "Pass"
        Result = {
          count = 0
        }
        ResultPath = "$.retryCount"
        Next       = "WaitForChunks"
      }

      WaitForChunks = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.check_chunks_status.arn
          Payload = {
            "meeting_id.$"    = "$.meeting_id"
            "total_chunks.$"  = "$.total_chunks"
            "session_id.$"    = "$.session_id"
          }
        }
        ResultSelector = {
          "totalChunks.$"     = "$.Payload.totalChunks"
          "completedCount.$"  = "$.Payload.completedCount"
          "failedCount.$"     = "$.Payload.failedCount"
          "pendingCount.$"    = "$.Payload.pendingCount"
          "allCompleted.$"    = "$.Payload.allCompleted"
          "hasFailures.$"     = "$.Payload.hasFailures"
        }
        ResultPath = "$.chunkStatus"
        Next       = "EvaluateChunkStatus"
        Retry = [
          {
            ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            ResultPath  = "$.error"
            Next        = "HandleError"
          }
        ]
      }

      EvaluateChunkStatus = {
        Type = "Choice"
        Choices = [
          {
            Variable      = "$.chunkStatus.allCompleted"
            BooleanEquals = true
            Next          = "InitializeSyncRetryCount"
          },
          {
            And = [
              {
                Variable             = "$.chunkStatus.hasFailures"
                BooleanEquals        = true
              },
              {
                Variable             = "$.chunkStatus.pendingCount"
                NumericEquals        = 0
              }
            ]
            Next = "HandlePartialFailure"
          },
          {
            Variable           = "$.chunkStatus.pendingCount"
            NumericGreaterThan = 0
            Next               = "WaitAndRetry"
          }
        ]
        Default = "InitializeSyncRetryCount"
      }

      InitializeSyncRetryCount = {
        Type = "Pass"
        Result = {
          count = 0
        }
        ResultPath = "$.syncRetryCount"
        Next       = "CheckSyncStatus"
      }

      CheckSyncStatus = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.check_sync_status.arn
          Payload = {
            "meeting_id.$" = "$.meeting_id"
          }
        }
        ResultSelector = {
          "totalSegments.$"  = "$.Payload.totalSegments"
          "syncedCount.$"    = "$.Payload.syncedCount"
          "unsyncedCount.$"  = "$.Payload.unsyncedCount"
          "allSynced.$"      = "$.Payload.allSynced"
        }
        ResultPath = "$.syncStatus"
        Next       = "EvaluateSyncStatus"
        Retry = [
          {
            ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            ResultPath  = "$.error"
            Next        = "HandleError"
          }
        ]
      }

      EvaluateSyncStatus = {
        Type = "Choice"
        Choices = [
          {
            Variable      = "$.syncStatus.allSynced"
            BooleanEquals = true
            Next          = "GenerateNotes"
          },
          {
            Variable           = "$.syncStatus.unsyncedCount"
            NumericGreaterThan = 0
            Next               = "WaitForSync"
          }
        ]
        Default = "GenerateNotes"
      }

      WaitForSync = {
        Type    = "Wait"
        Seconds = 10
        Next    = "IncrementSyncRetryCount"
      }

      IncrementSyncRetryCount = {
        Type = "Pass"
        Parameters = {
          "count.$" = "States.MathAdd($.syncRetryCount.count, 1)"
        }
        ResultPath = "$.syncRetryCount"
        Next       = "CheckMaxSyncRetries"
      }

      CheckMaxSyncRetries = {
        Type = "Choice"
        Choices = [
          {
            Variable           = "$.syncRetryCount.count"
            NumericGreaterThan = 30  # 30 * 10s = 5 minutes max wait for sync
            Next               = "GenerateNotes"  # Proceed anyway after timeout
          }
        ]
        Default = "CheckSyncStatus"
      }

      WaitAndRetry = {
        Type    = "Wait"
        Seconds = 30
        Next    = "IncrementRetryCount"
      }

      IncrementRetryCount = {
        Type = "Pass"
        Parameters = {
          "count.$" = "States.MathAdd($.retryCount.count, 1)"
        }
        ResultPath = "$.retryCount"
        Next       = "CheckMaxRetries"
      }

      CheckMaxRetries = {
        Type = "Choice"
        Choices = [
          {
            Variable           = "$.retryCount.count"
            NumericGreaterThan = 20  # 20 * 30s = 10 minutes max wait
            Next               = "HandlePartialFailure"
          }
        ]
        Default = "WaitForChunks"
      }

      HandlePartialFailure = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.handle_partial_failure.arn
          Payload = {
            "meeting_id.$"   = "$.meeting_id"
            "session_id.$"   = "$.session_id"
            "chunkStatus.$"  = "$.chunkStatus"
          }
        }
        ResultSelector = {
          "failedChunks.$"       = "$.Payload.failedChunks"
          "failedCount.$"        = "$.Payload.failedCount"
          "timeGaps.$"           = "$.Payload.timeGaps"
          "proceedWithPartial.$" = "$.Payload.proceedWithPartial"
        }
        ResultPath = "$.partialResult"
        Next       = "GenerateNotesPartial"
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            ResultPath  = "$.error"
            Next        = "HandleError"
          }
        ]
      }

      GenerateNotesPartial = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.generate_notes.arn
          Payload = {
            "meeting_id.$"     = "$.meeting_id"
            "partial"          = true
            "failedChunks.$"   = "$.partialResult.failedChunks"
            "timeGaps.$"       = "$.partialResult.timeGaps"
          }
        }
        ResultSelector = {
          "success.$"   = "$.Payload.success"
          "partial.$"   = "$.Payload.partial"
          "notesId.$"   = "$.Payload.notesId"
        }
        ResultPath = "$.notes"
        Next       = "UpdateMeetingStatus"
        Retry = [
          {
            ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException"]
            IntervalSeconds = 5
            MaxAttempts     = 2
            BackoffRate     = 2
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            ResultPath  = "$.error"
            Next        = "UpdateMeetingStatusFailed"
          }
        ]
      }

      GenerateNotes = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.generate_notes.arn
          Payload = {
            "meeting_id.$" = "$.meeting_id"
            "partial"      = false
          }
        }
        ResultSelector = {
          "success.$" = "$.Payload.success"
          "partial.$" = "$.Payload.partial"
          "notesId.$" = "$.Payload.notesId"
        }
        ResultPath = "$.notes"
        Next       = "UpdateMeetingStatus"
        Retry = [
          {
            ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException"]
            IntervalSeconds = 5
            MaxAttempts     = 2
            BackoffRate     = 2
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            ResultPath  = "$.error"
            Next        = "UpdateMeetingStatusFailed"
          }
        ]
      }

      UpdateMeetingStatus = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.update_meeting_status.arn
          Payload = {
            "meeting_id.$"      = "$.meeting_id"
            "status"            = "completed"
            "notes_generated.$" = "$.notes.success"
            "partial.$"         = "$.notes.partial"
          }
        }
        End = true
        Retry = [
          {
            ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            ResultPath  = "$.error"
            Next        = "HandleError"
          }
        ]
      }

      UpdateMeetingStatusFailed = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.update_meeting_status.arn
          Payload = {
            "meeting_id.$"     = "$.meeting_id"
            "status"           = "completed"
            "notes_generated"  = false
            "partial"          = true
            "error.$"          = "$.error"
          }
        }
        End = true
      }

      HandleError = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.update_meeting_status.arn
          Payload = {
            "meeting_id.$" = "$.meeting_id"
            "status"       = "failed"
            "error.$"      = "$.error"
          }
        }
        End = true
      }
    }
  })

  tags = {
    Name = "${var.project_name}-meeting-completion"
  }
}
