import { readFileSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

type QueueNamePrefix = string;
type SystemName = string;
type Email = string;

type SystemConfig = Record<SystemName, QueueNamePrefix[]>;
type UserConfig = Record<SystemName, Email[]>;

export type AppConfig = {
  systems: SystemConfig;
  systemUsers: UserConfig;
};

function parseConfig(config: unknown): AppConfig {
  if (typeof config !== 'object' || config === null) {
    throw new Error('Config must be an object');
  }

  if (
    !('systems' in config) ||
    typeof config.systems !== 'object' ||
    config.systems === null
  ) {
    throw new Error('Config must have a "systems" object');
  }

  if (
    !('system_users' in config) ||
    typeof config.system_users !== 'object' ||
    config.system_users === null
  ) {
    throw new Error('Config must have a "system_users" object');
  }

  for (const [system, prefixs] of Object.entries(config.systems)) {
    if (!Array.isArray(prefixs)) {
      throw new Error(
        `Queue name prefix for system "${system}" must be a string of array`,
      );
    }
  }

  for (const [system, users] of Object.entries(config.system_users)) {
    if (!Array.isArray(users)) {
      throw new Error(`Users for system "${system}" must be an array`);
    }
    for (const email of users) {
      if (typeof email !== 'string') {
        throw new Error(
          `Email "${email}" for system "${system}" must be a string`,
        );
      }
    }
  }

  return {
    systems: config.systems as SystemConfig,
    systemUsers: config.system_users as UserConfig,
  };
}

function loadConfig(): AppConfig {
  const configFile = path.resolve(process.cwd(), 'config.yaml');
  const rawYaml = readFileSync(configFile, 'utf-8');
  const config = yaml.load(rawYaml);
  return parseConfig(config);
}

let cachedConfig: AppConfig | null = null;

function getConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = loadConfig();
  return cachedConfig;
}

export function isUserAllowedToLogin(email: Email): boolean {
  const config = getConfig();

  for (const users of Object.values(config.systemUsers)) {
    if (users.includes(email)) {
      return true;
    }
  }
  return false;
}

export function getAllowedQueueNamePatternsByEmail(
  email: Email,
): QueueNamePrefix[] {
  const config = getConfig();

  const isAdmin = config.systemUsers.admin?.includes(email) ?? false;
  if (isAdmin) {
    return ['*'];
  }

  const matchedSystems = Object.entries(config.systemUsers)
    .filter(([, users]) => users.includes(email))
    .map(([system]) => system);

  const queueNamePatterns = matchedSystems.flatMap(
    (system) => config.systems[system] || [],
  );

  return Array.from(new Set(queueNamePatterns));
}
