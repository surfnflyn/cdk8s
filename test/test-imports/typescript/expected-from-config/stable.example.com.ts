// generated by cdk8s
import { ApiObject, GroupVersionKind } from 'cdk8s';
import { Construct } from 'constructs';

/**
 * 
 *
 * @schema CronTab
 */
export class CronTab extends ApiObject {
  /**
   * Returns the apiVersion and kind for "CronTab"
   */
  public static readonly GVK: GroupVersionKind = {
    apiVersion: 'stable.example.com/v1',
    kind: 'CronTab',
  }

  /**
   * Renders a Kubernetes manifest for "CronTab".
   *
   * This can be used to inline resource manifests inside other objects (e.g. as templates).
   *
   * @param props initialization props
   */
  public static manifest(props: CronTabProps = {}): any {
    return {
      ...CronTab.GVK,
      ...props,
    };
  }

  /**
   * Defines a "CronTab" API object
   * @param scope the scope in which to define this object
   * @param id a scope-local name for the object
   * @param props initialization props
   */
  public constructor(scope: Construct, id: string, props: CronTabProps = {}) {
    super(scope, id, CronTab.manifest(props));
  }
}

/**
 * @schema CronTab
 */
export interface CronTabProps {
  /**
   * @schema CronTab#spec
   */
  readonly spec?: CronTabSpec;

}

/**
 * @schema CronTabSpec
 */
export interface CronTabSpec {
  /**
   * @schema CronTabSpec#cronSpec
   */
  readonly cronSpec?: string;

  /**
   * @schema CronTabSpec#image
   */
  readonly image?: string;

  /**
   * @schema CronTabSpec#replicas
   */
  readonly replicas?: number;

}

