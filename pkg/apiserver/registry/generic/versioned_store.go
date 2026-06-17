package generic

import (
	"context"

	"k8s.io/apimachinery/pkg/api/meta"
	metainternalversion "k8s.io/apimachinery/pkg/apis/meta/internalversion"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apiserver/pkg/registry/generic/registry"
)

func normalizeObjectVersion(obj runtime.Object, targetGV schema.GroupVersion) {
	if obj == nil {
		return
	}

	normalizeSingleObjectVersion(obj, targetGV)

	items, err := meta.ExtractList(obj)
	if err != nil {
		return
	}

	for _, item := range items {
		normalizeSingleObjectVersion(item, targetGV)
	}
}

func normalizeSingleObjectVersion(obj runtime.Object, targetGV schema.GroupVersion) {
	gvk := obj.GetObjectKind().GroupVersionKind()
	if gvk.Group == targetGV.Group && gvk.Version != targetGV.Version {
		obj.GetObjectKind().SetGroupVersionKind(targetGV.WithKind(gvk.Kind))
	}
}

// VersionedStore wraps a registry.Store and overrides List to re-stamp each
// item's GroupVersionKind so it matches the API version being served. This is
// needed when the same Go types are registered under multiple API versions.
type VersionedStore struct {
	*registry.Store
	targetGV schema.GroupVersion
}

// NewVersionedStore creates a VersionedStore that re-stamps list items to
// match targetGV. Use this when the underlying store may return items whose
// GVK differs from the API version being served (shared-type multi-version
// pattern).
func NewVersionedStore(store *registry.Store, targetGV schema.GroupVersion) *VersionedStore {
	return &VersionedStore{Store: store, targetGV: targetGV}
}

func (v *VersionedStore) List(ctx context.Context, options *metainternalversion.ListOptions) (runtime.Object, error) {
	obj, err := v.Store.List(ctx, options)
	if err != nil {
		return nil, err
	}

	normalizeObjectVersion(obj, v.targetGV)
	return obj, nil
}
