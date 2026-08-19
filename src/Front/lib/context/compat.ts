export interface SDK<T> {
  sdk: T;
  init: (props: ContextConfig) => Promise<void>;
}

interface ContextConfig {
  sitecoreEdgeUrl: string;
  sitecoreEdgeContextId: string;
  siteName: string;
}

type SdkMap = Record<string, SDK<unknown>>;

interface ContextOptions<TSdks extends SdkMap> extends ContextConfig {
  sdks: TSdks;
}

interface InitOptions {
  siteName?: string;
  pageState?: string;
}

export class Context<TSdks extends SdkMap> {
  private config: ContextConfig;
  private sdks: TSdks;
  private cache = new Map<string, unknown>();

  constructor({ sdks, ...config }: ContextOptions<TSdks>) {
    this.config = config;
    this.sdks = sdks;
  }

  init({ siteName }: InitOptions): void {
    if (siteName) {
      this.config = { ...this.config, siteName };
    }
    this.cache.clear();
  }

  async getSDK<K extends keyof TSdks & string>(name: K): Promise<TSdks[K]['sdk']> {
    if (this.cache.has(name)) {
      return this.cache.get(name) as TSdks[K]['sdk'];
    }
    const sdkEntry = this.sdks[name];
    await sdkEntry.init(this.config);
    this.cache.set(name, sdkEntry.sdk);
    return sdkEntry.sdk as TSdks[K]['sdk'];
  }
}
