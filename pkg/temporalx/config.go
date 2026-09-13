package temporalx

type Config struct {
	HostPort  string `json:",default=127.0.0.1:7233"`
	Namespace string `json:",default=default"`
	TaskQueue string `json:",default=ORDER_TASK_QUEUE,optional"`
}
