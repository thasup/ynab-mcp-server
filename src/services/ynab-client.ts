import * as ynab from "ynab";
import { MoneyMovementsApi } from "ynab";
import { Configuration } from "ynab";
import { YNAB_API_TOKEN_ENV } from "../constants.js";

let _client: ynab.API | null = null;
let _moneyMovements: MoneyMovementsApi | null = null;

export function setYnabToken(token: string) {
  if (typeof process === "undefined") {
    (globalThis as any).process = { env: {} };
  } else if (!process.env) {
    process.env = {};
  }
  process.env[YNAB_API_TOKEN_ENV] = token;
}

export function getYnabClient(): ynab.API {
  if (!_client) {
    const token = process.env[YNAB_API_TOKEN_ENV];
    if (!token) {
      throw new Error(
        `${YNAB_API_TOKEN_ENV} environment variable is required. ` +
          "Get your personal access token from https://app.ynab.com/settings/developer"
      );
    }
    _client = new ynab.API(token);
    _moneyMovements = new MoneyMovementsApi(
      new Configuration({ accessToken: token })
    );
  }
  return _client;
}

export function getMoneyMovementsApi(): MoneyMovementsApi {
  getYnabClient(); // ensures _moneyMovements is initialized
  return _moneyMovements!;
}
