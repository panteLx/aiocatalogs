# Next Steps (D1 Template + Cloudflare workers)

> [!NOTE]
> If you have a better workflow, feel free to open an issue or a PR.

Here are docs from cloudflare [workers+nextjs](https://developers.cloudflare.com/workers/frameworks/framework-guides/nextjs/).
Here you also have the workers & pages compatibility matrix [here](https://developers.cloudflare.com/workers/static-assets/compatibility-matrix/).
Run the following command to create a D1 Database, then update the `database_id` in `wrangler.toml`. (Cloudflare's D1 [guide](https://developers.cloudflare.com/d1/get-started/))

```sh
pnpx wrangler d1 create <DATABASE-NAME>
```

## 1. Set Up Database and Run Migrations

> [!IMPORTANT]
> Running drizzle-kit commands for remote databases requires valid cloudflare environment variables ([guide](#3-optional-configure-cloudflare-environment-variables))

Once you have updated your `wrangler.toml` with the correct `database_id`, follow the instructions below.

<details>
  <summary>Using Wrangler for <code>local</code> database</summary>

```sh
pnpm db:generate
pnpm d1:migrate:local
pnpm dev # or pnpm preview
```

</details>

<details>
  <summary>Using Wrangler for <code>remote</code> database</summary>
  
  ```sh
  pnpm db:generate
  pnpm d1:migrate:remote
  pnpm dev # or pnpm preview
  ```
</details>

<details>
  <summary>Using Drizzle-Kit for <code>local</code> database</summary>
  
  ### Using Migrations
  ```sh
  pnpm db:generate
  pnpm db:migrate:local
  pnpm dev # or pnpm preview
  ```

### Pushing Schema Changes

```sh
pnpm db:push:local
pnpm dev # or pnpm preview
```

</details>

<details>
  <summary>Using Drizzle-Kit for <code>remote</code> database <strong>requires Cloudflare environment variables</strong></summary> 
  
  ### Using Migrations
  ```sh
  pnpm db:generate
  pnpm db:migrate
  pnpm dev # or pnpm preview
  ```

### Pushing Schema Changes

```sh
pnpm db:push
pnpm dev # or pnpm preview
```

</details>

## 2. Deployment

To deploy to Cloudflare, you can connect your application via cloudflare dashboard (GitHub integration) or run `pnpm deploy`. follow [Cloudflare's Next.js guide](https://developers.cloudflare.com/pages/framework-guides/nextjs/ssr/get-started/#6-deploy-to-cloudflare-pages).

## 3. (Optional) Configure Cloudflare Environment Variables

You can run migrations using `wrangler d1 migrations ...`, but if you want to use `drizzle-kit` instead, you need to configure your environment variables.

```sh
cp .dev.vars.example .dev.vars
```

You can find `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, and `CLOUDFLARE_TOKEN` in the Cloudflare dashboard:

- To get `CLOUDFLARE_ACCOUNT_ID`, go to Workers & Pages -> Overview -> copy Account ID from the right sidebar.
- To get `CLOUDFLARE_DATABASE_ID`, open the D1 database you want to connect to and copy the Database ID.
- To get `CLOUDFLARE_TOKEN`, go to My Profile -> API Tokens and create a token with D1 edit permissions.

Now you can run Drizzle-Kit remote commands such as `db:push`, `db:migrate`, `db:studio`, etc.
