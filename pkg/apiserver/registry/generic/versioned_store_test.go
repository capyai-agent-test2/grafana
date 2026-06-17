package generic

import (
	"testing"

	"k8s.io/apimachinery/pkg/runtime/schema"
)

func TestNormalizeObjectVersion_RewritesSingleObjectVersion(t *testing.T) {
	targetGV := schema.GroupVersion{Group: "dashboard.grafana.app", Version: "v1"}
	obj := &mockObject{}
	obj.SetGroupVersionKind(schema.GroupVersionKind{Group: targetGV.Group, Version: "v1beta1", Kind: "Dashboard"})

	normalizeObjectVersion(obj, targetGV)

	gvk := obj.GroupVersionKind()
	if gvk != targetGV.WithKind("Dashboard") {
		t.Fatalf("expected %s, got %s", targetGV.WithKind("Dashboard"), gvk)
	}
}

func TestNormalizeObjectVersion_RewritesListItemsOnlyWithinTargetGroup(t *testing.T) {
	targetGV := schema.GroupVersion{Group: "dashboard.grafana.app", Version: "v1"}
	list := &mockObjectList{}
	list.SetGroupVersionKind(schema.GroupVersionKind{Group: targetGV.Group, Version: targetGV.Version, Kind: "DashboardList"})
	list.Items = []mockObject{
		newMockObject(targetGV.Group, "v1beta1", "Dashboard"),
		newMockObject(targetGV.Group, targetGV.Version, "Dashboard"),
		newMockObject("folder.grafana.app", "v1beta1", "Folder"),
	}

	normalizeObjectVersion(list, targetGV)

	if got := list.Items[0].GroupVersionKind(); got != targetGV.WithKind("Dashboard") {
		t.Fatalf("expected first item to be restamped to %s, got %s", targetGV.WithKind("Dashboard"), got)
	}
	if got := list.Items[1].GroupVersionKind(); got != targetGV.WithKind("Dashboard") {
		t.Fatalf("expected second item to stay at %s, got %s", targetGV.WithKind("Dashboard"), got)
	}
	if got := list.Items[2].GroupVersionKind(); got != (schema.GroupVersionKind{Group: "folder.grafana.app", Version: "v1beta1", Kind: "Folder"}) {
		t.Fatalf("expected different-group item to stay unchanged, got %s", got)
	}
}

func newMockObject(group, version, kind string) mockObject {
	obj := mockObject{}
	obj.SetGroupVersionKind(schema.GroupVersionKind{Group: group, Version: version, Kind: kind})
	return obj
}
