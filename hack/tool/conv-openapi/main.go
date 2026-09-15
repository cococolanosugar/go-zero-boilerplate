package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"strings"

	"github.com/getkin/kin-openapi/openapi2"
	"github.com/getkin/kin-openapi/openapi2conv"
)

var (
	inputPath  = flag.String("input", "manifest/openapi/openapi.json", "Swagger 2.0 input file")
	outputPath = flag.String("output", "manifest/openapi/openapi.json", "OpenAPI 3 output file")
)

func main() {
	flag.Parse()

	data, err := os.ReadFile(*inputPath)
	if err != nil {
		fail("read input", err)
	}

	var swagger openapi2.T
	if err := json.Unmarshal(data, &swagger); err != nil {
		fail("parse Swagger 2.0 document", err)
	}

	openapi, err := openapi2conv.ToV3(&swagger)
	if err != nil {
		fail("convert Swagger 2.0 document", err)
	}

	for routePath, pathItem := range openapi.Paths.Map() {
		for _, operation := range pathItem.Operations() {
			for _, parameterRef := range operation.Parameters {
				if parameterRef.Value != nil && parameterRef.Value.Schema != nil && parameterRef.Value.Schema.Value != nil {
					parameterRef.Value.Schema.Value.AllowEmptyValue = false
				}
			}
			operation.Tags = []string{tagForPath(routePath)}
			operation.OperationID = cleanOperationID(operation.OperationID)
		}
	}

	output, err := json.MarshalIndent(openapi, "", "  ")
	if err != nil {
		fail("encode OpenAPI 3 document", err)
	}
	output = append(output, '\n')

	if err := os.WriteFile(*outputPath, output, 0644); err != nil {
		fail("write output", err)
	}

	fmt.Printf("[conv-openapi] Converted Swagger 2.0 to OpenAPI %s: %s\n", openapi.OpenAPI, *outputPath)
}

func tagForPath(routePath string) string {
	switch {
	case strings.HasPrefix(routePath, "/api/v1/portal/navigation"),
		strings.HasPrefix(routePath, "/api/v1/system/navigation"):
		return "navigation"
	case strings.HasPrefix(routePath, "/api/v1/system/dict"):
		return "dict"
	case strings.HasPrefix(routePath, "/api/v1/system/task"):
		return "task"
	}

	parts := strings.Split(strings.TrimPrefix(routePath, "/"), "/")
	if len(parts) >= 3 && parts[0] == "api" && parts[1] == "v1" && parts[2] != "" {
		return parts[2]
	}

	return "other"
}

func cleanOperationID(operationID string) string {
	if operationID == "" {
		return operationID
	}

	var builder strings.Builder
	capitalize := false
	for _, character := range operationID {
		switch character {
		case '/', '_', '-':
			capitalize = true
		default:
			if capitalize {
				character = []rune(strings.ToUpper(string(character)))[0]
				capitalize = false
			}
			builder.WriteRune(character)
		}
	}
	return builder.String()
}

func fail(action string, err error) {
	fmt.Fprintf(os.Stderr, "[conv-openapi] failed to %s: %v\n", action, err)
	os.Exit(1)
}
