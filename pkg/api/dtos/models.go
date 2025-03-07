package dtos

import (
	"crypto/md5"
	"fmt"
	"net/http"
	"regexp"
	"strings"

	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/setting"
)

var regNonAlphaNumeric = regexp.MustCompile("[^a-zA-Z0-9]+")
var mlog = log.New("models")

type AnyId struct {
	Id int64 `json:"id"`
}

type LoginCommand struct {
	User     string `json:"user" binding:"Required"`
	Password string `json:"password" binding:"Required"`
	Remember bool   `json:"remember"`
}

type CurrentUser struct {
	IsSignedIn                 bool               `json:"isSignedIn"`
	Id                         int64              `json:"id"`
	ExternalUserId             string             `json:"externalUserId"`
	Login                      string             `json:"login"`
	Email                      string             `json:"email"`
	Name                       string             `json:"name"`
	LightTheme                 bool               `json:"lightTheme"`
	OrgCount                   int                `json:"orgCount"`
	OrgId                      int64              `json:"orgId"`
	OrgName                    string             `json:"orgName"`
	OrgRole                    models.RoleType    `json:"orgRole"`
	IsGrafanaAdmin             bool               `json:"isGrafanaAdmin"`
	GravatarUrl                string             `json:"gravatarUrl"`
	Timezone                   string             `json:"timezone"`
	WeekStart                  string             `json:"weekStart"`
	Locale                     string             `json:"locale"`
	HelpFlags1                 models.HelpFlags1  `json:"helpFlags1"`
	HasEditPermissionInFolders bool               `json:"hasEditPermissionInFolders"`
	Permissions                UserPermissionsMap `json:"permissions,omitempty"`
}

type UserPermissionsMap map[string]bool

// swagger:model
type MetricRequest struct {
	// From Start time in epoch timestamps in milliseconds or relative using Grafana time units.
	// required: true
	// example: now-1h
	From string `json:"from"`
	// To End time in epoch timestamps in milliseconds or relative using Grafana time units.
	// required: true
	// example: now
	To string `json:"to"`
	// queries.refId – Specifies an identifier of the query. Is optional and default to “A”.
	// queries.datasourceId – Specifies the data source to be queried. Each query in the request must have an unique datasourceId.
	// queries.maxDataPoints - Species maximum amount of data points that dashboard panel can render. Is optional and default to 100.
	// queries.intervalMs - Specifies the time interval in milliseconds of time series. Is optional and defaults to 1000.
	// required: true
	// example: [ { "refId": "A", "intervalMs": 86400000, "maxDataPoints": 1092, "datasource":{ "uid":"PD8C576611E62080A" }, "rawSql": "SELECT 1 as valueOne, 2 as valueTwo", "format": "table" } ]
	Queries []*simplejson.Json `json:"queries"`
	// required: false
	Debug bool `json:"debug"`

	HTTPRequest *http.Request `json:"-"`
}

func (mr *MetricRequest) CloneWithQueries(queries []*simplejson.Json) MetricRequest {
	return MetricRequest{
		From:        mr.From,
		To:          mr.To,
		Queries:     queries,
		Debug:       mr.Debug,
		HTTPRequest: mr.HTTPRequest,
	}
}

func GetGravatarUrl(text string) string {
	if setting.DisableGravatar {
		return setting.AppSubUrl + "/public/img/user_profile.png"
	}

	if text == "" {
		return ""
	}

	hash, _ := GetGravatarHash(text)
	return fmt.Sprintf(setting.AppSubUrl+"/avatar/%x", hash)
}

func GetGravatarHash(text string) ([]byte, bool) {
	if text == "" {
		return make([]byte, 0), false
	}

	hasher := md5.New()
	if _, err := hasher.Write([]byte(strings.ToLower(text))); err != nil {
		mlog.Warn("Failed to hash text", "err", err)
	}
	return hasher.Sum(nil), true
}

func GetGravatarUrlWithDefault(text string, defaultText string) string {
	if text != "" {
		return GetGravatarUrl(text)
	}

	text = regNonAlphaNumeric.ReplaceAllString(defaultText, "") + "@localhost"

	return GetGravatarUrl(text)
}

func IsHiddenUser(userLogin string, signedInUser *models.SignedInUser, cfg *setting.Cfg) bool {
	if userLogin == "" || signedInUser.IsGrafanaAdmin || userLogin == signedInUser.Login {
		return false
	}

	if _, hidden := cfg.HiddenUsers[userLogin]; hidden {
		return true
	}

	return false
}
