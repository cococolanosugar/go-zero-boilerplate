package perm

const (
	// 字典类型
	DictTypeList   = "system:dict_type:list"
	DictTypeCreate = "system:dict_type:create"
	DictTypeUpdate = "system:dict_type:update"
	DictTypeDelete = "system:dict_type:delete"

	// 字典数据项
	DictDataList   = "system:dict_data:list"
	DictDataCreate = "system:dict_data:create"
	DictDataUpdate = "system:dict_data:update"
	DictDataDelete = "system:dict_data:delete"
)

func init() {
	RegisterGroup("dict", "数据字典", []Item{
		{Code: DictTypeList, Name: "查询字典类型"},
		{Code: DictTypeCreate, Name: "新增字典类型"},
		{Code: DictTypeUpdate, Name: "编辑字典类型"},
		{Code: DictTypeDelete, Name: "删除字典类型"},
		{Code: DictDataList, Name: "查询字典数据"},
		{Code: DictDataCreate, Name: "新增字典数据"},
		{Code: DictDataUpdate, Name: "编辑字典数据"},
		{Code: DictDataDelete, Name: "删除字典数据"},
	})
}
