import * as pulumi from "@pulumi/pulumi";
import * as grafana from "@pulumiverse/grafana";
import * as fs from "fs";
import * as path from "path";


const config = new pulumi.Config("grafana-provisioning");
const grafanaUrl = config.require("grafanaUrl");
const grafanaAuth = config.require("grafanaAuth");

// Configure the Grafana provider
const provider = new grafana.Provider("grafana", {
    url: grafanaUrl,
    auth: grafanaAuth,
});

// Configure Tempo data source
const tempoDataSource = new grafana.oss.DataSource("tempo-datasource", {
    type: "tempo",
    name: "Tempo",
    url: "http://tempo:3200",
    isDefault: true,
    accessMode: "proxy",
    jsonDataEncoded: JSON.stringify({
        nodeGraphEnabled: true,
        serviceMapEnabled: true,
        spanBarEnabled: true,
        tracesToLogsEnabled: true,
    }),
}, { provider });

// Load dashboard JSON from file
const dashboardJsonPath = path.join(__dirname, "dashboards", "user-dashboard.json");
const dashboardJson = JSON.parse(fs.readFileSync(dashboardJsonPath, "utf8"));

// Create folder first
const observabilityFolder = new grafana.oss.Folder("observability-folder", {
    title: "Observability",
}, { provider });

// Then create dashboard
const dashboard = new grafana.oss.Dashboard("user-service-dashboard", {
    configJson: pulumi.all([tempoDataSource.uid, observabilityFolder.id]).apply(([uid, folderId]) => {
        const dashboardConfig = JSON.parse(JSON.stringify(dashboardJson));
        
        // Set UID and title
        dashboardConfig.uid = "user-service-tempo-dashboard";
        dashboardConfig.title = "User Service - Tempo Traces";
        
        // Update datasource references
        function updateDatasource(obj: any) {
            if (obj?.datasource?.type === "tempo") {
                obj.datasource.uid = uid;
            }
            if (obj?.datasource === "Tempo") {
                obj.datasource = { type: "tempo", uid: uid };
            }
        }
        
        dashboardConfig.panels?.forEach((panel: any) => {
            updateDatasource(panel);
            panel.targets?.forEach(updateDatasource);
        });
        
        dashboardConfig.templating?.list?.forEach(updateDatasource);
        
        return JSON.stringify(dashboardConfig);
    }),
    folder: observabilityFolder.id,
    overwrite: true,
}, { provider });

// Export the dashboard URL
export const dashboardUrl = pulumi.interpolate`${grafanaUrl}/d/${dashboard.uid}`;