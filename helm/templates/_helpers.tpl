{{/*
Chart name, truncated to 63 chars.
*/}}
{{- define "sqsadmin.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Fully qualified app name.
*/}}
{{- define "sqsadmin.fullname" -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels.
*/}}
{{- define "sqsadmin.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "sqsadmin.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels.
*/}}
{{- define "sqsadmin.selectorLabels" -}}
app.kubernetes.io/name: {{ include "sqsadmin.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
