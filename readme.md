# Observable Backend Service Example

## Project

This project provides Azure Functions for managing products.

### Available Endpoints

- `GET /api/products` - List all products
- `POST /api/products` - Upsert (create or update) a product
- `PUT /api/products` - Upsert (create or update) a product

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local settings file:

Copy the template to create your local development settings:

```bash
cp local.settings.template.json local.settings.json
```

> **Note:** Never commit your `local.settings.json` to source control. The template is safe to share.

3. Build the project:

```bash
npm run build
```

## Local testing with curl

### Start the Function App

```bash
npm start
```

The function app will start on `http://localhost:7071`.

### List Products

Split the VS Code terminal so you can see the output from the localling running app whilst having a new shell prompt to make a test HTTP call:

```bash
curl -i http://localhost:7071/api/products
```

The fake repo initialises with some example data, so expect an array of products.

### Upsert a Product

Using the sample data file (and a new bash terminal):

```bash
curl -i -X POST http://localhost:7071/api/products \
  -H "Content-Type: application/json" \
  -d @samples/product-post.json
```

Repeating the list products call should now show the new item.

## Azure Setup

### Sign into Azure CLI

Prepare for using the az CLI commands.

1. Ensure you are signed in:

```bash
az login
az account show
```

You should see your account properties displayed if you are successfully signed in.

2. Ensure you know which locations (e.g. uksouth) you are permitted to use:

```bash
az policy assignment list \
  --query "[?name.contains(@, 'sys.regionrestriction')].parameters.listOfAllowedLocations.value | []" \
  -o tsv
```

### Create a Resource Group and Azure Function App

1. Create a resource group (if you do not already have one for this deployment):

```bash
az group create \
  --name ica-rg \
  --location uksouth
```

Remember to follow our naming convention, e.g. shopping-lab-ab47-rg

2. Create a storage account (required for Azure Functions):

```bash
az storage account create \
  --name icastoragejc76 \
  --location uksouth \
  --resource-group ica-rg \
  --sku Standard_LRS
```

3. Create the Function App:

```bash
az functionapp create \
  --name ica-function-jc76 \
  --resource-group ica-rg \
  --storage-account icastoragejc76 \
  --consumption-plan-location uksouth \
  --runtime node \
  --functions-version 4
```

### Publish the Project to Azure

Deploy your code to the Function App:

```bash
func azure functionapp publish ica-function-jc76
```

You can now access your endpoints at:

```
https://ica-function-jc76.azurewebsites.net/api/products
```

### Configure the Monitoring

1. Create a Log Analytics Workspace (if you don't already have one for this environment):

   ```bash
   az monitor log-analytics workspace create \
     --name <your-workspace-name> \
     --resource-group ica-rg \
     --location uksouth
   ```

2. Connect the Application Insights to the Log Analytics Workspace

   ```bash
   az monitor app-insights component update \
     --app ica-function-jc76 \
     --resource-group ica-rg \
     --workspace <your-workspace-name>
   ```

   > Your version of the CLI may ask permission to upgrade the extension: say Y

   Alternatively, you can make this change in the Azure Portal within the Application Insight resource > Configure > Properties > Change Workspace.

3. Connect the Resource Telemetry to the Log Analytics Workspace

   ```bash
   az monitor diagnostic-settings create \
     --name send-to-law \
     --resource ica-function-jc76 \
     --resource-type Microsoft.Web/sites \
     --resource-group ica-rg \
     --workspace <your-workspace-name> \
     --logs '[{"category":"FunctionAppLogs","enabled":true}]' \
     --metrics '[{"category":"AllMetrics","enabled":true}]'
   ```

   Alternatively, you can make this change in the Azure Portal within the Function App resource > Monitoring > Diagnostic settings > Add diagnostic setting.

   If your backend service uses a database, you could also send its telemetry to your Log Analytics workspace:

   ```bash
   az monitor diagnostic-settings create \
   --name send-to-law \
   --resource <your-cosmos-account> \
   --resource-type Microsoft.DocumentDB/databaseAccounts \
   --resource-group ica-rg \
   --workspace <your-workspace-name> \
   --export-to-resource-specific true \
   --logs '[
   {"category":"DataPlaneRequests","enabled":true},
   {"category":"QueryRuntimeStatistics","enabled":true},
   {"category":"PartitionKeyStatistics","enabled":true},
   {"category":"ControlPlaneRequests","enabled":true}
   ]' \
   --metrics '[
   {"category":"AllMetrics","enabled":true}
   ]'
   ```

## Product Updated Notifications

This service emits a "product updated" integration event after a successful upsert.

- Default behavior: uses a dummy adapter that logs the event to the console.
- HTTP adapter: enabled when the environment variable `PRODUCT_UPDATED_BASE_URL` is set.

When enabled, the service will POST to:

- `POST ${PRODUCT_UPDATED_BASE_URL}/integration/events/product-updated`

with a JSON body shaped as:

```
{
  "id": "string",
  "name": "string",
  "pricePence": 1234,
  "description": "string",
  "updatedAt": "2025-01-01T12:34:56.000Z" // ISO string
}
```

### Configure locally

Update `local.settings.json` (created from the template) to include the base URL of your receiver:

```
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "PRODUCT_UPDATED_BASE_URL": "https://your-receiver.azurewebsites.net"
  }
}
```

Remove `PRODUCT_UPDATED_BASE_URL` (or leave it empty) to fall back to the dummy logger.

### Configure in Azure

Set the application setting `PRODUCT_UPDATED_BASE_URL` on your Function App to the receiver's base URL. The app will automatically switch to the HTTP adapter at startup.

You can set this via Azure CLI:

```bash
az functionapp config appsettings set \
  --name ica-function-jc76 \
  --resource-group ica-rg \
  --settings PRODUCT_UPDATED_BASE_URL=https://<your-receiver>.azurewebsites.net
```

If needed, restart the Function App to pick up changes immediately:

```bash
az functionapp restart \
  --name ica-function-jc76 \
  --resource-group ica-rg
```

If needed, allow cross-domain calls from your app domain and/or localhost, for example:

```bash
az functionapp cors add \
  --name ica-function-jc76 \
  --resource-group ica-rg \
  --allowed-origins http://localhost:5173
```
