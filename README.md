# Kubernetes Cloud Development Kit

![Stability: Experimental](https://img.shields.io/badge/stability-Experimental-important.svg?style=for-the-badge)

> Programmatically define Kubernetes applications using familiar programming
> languages.

The Kubernetes Cloud Development Kit (CDK) is a software development
framework for defining k8s applications using rich object-oriented APIs. It
allows developers to leverage the full power of software in order to define
abstract components called "constructs" which compose k8s resources or other
constructs into higher-level abstractions.

The Kubernetes CDK is based on the same design and technologies that are used to
for the [AWS Cloud Development Kit](https://aws.amazon.com/cdk), and k8s
constructs can interoperate with AWS CDK constructs to define cloud-native
applications that include both Kubernetes resources and AWS resources as first
class citizens.

## Approach

Kubernetes CDK apps are programs written in one of the supported programming
languages. They are structured as a tree of ["constructs"](https://docs.aws.amazon.com/cdk/latest/guide/constructs.html).

The root of the tree is an `App` construct. Within an app, users define any
number of stacks (classes that extend the `Stack` class) which are the CDK's
basic deployment unit.

Stack are, in turn, composed of any number of constructs, and eventually from
resources, which represent any Kubernetes resource, such as `Pod`, `Service`,
`Deployment`, `ReplicaSet`, etc.

CDK apps only _define_ Kubernetes applications, they don't actually apply them
to the cluster. When an app is executed, it *synthesizes* all the stacks defined
within the app into the `cdk.out` directory, and then those stacks can be
applied to any Kubernetes cluster using `kubectl apply -f cdk.out/stack`.

## Getting Started

Let's walk through a simple "Hello, World!" example. We will use the AWS CDK CLI
to initialize a new project and synthesize our Kubernetes CDK stacks, but we
will apply them using `kubectl` to our cluster.

### (temporary) Build k8scdk Locally

Since this module is still not published, you will need to first build it locally and link against the local version.

```console
$ git clone git@github.com:eladb/k8scdk
$ cdk k8scdk
$ npm i 
$ npm run build
$ npm link .
```


### New Project

Create a new CDK project (we'll use TypeScript):

```console
$ mkdir hello-k8scdk
$ cdk init -l typescript
```

Install the `k8scdk` module from the local link:

```console
$ npm link k8scdk
```

### Stacks

Delete the AWS CDK stack file that got generated by `cdk init` under `lib/` and
create a new file under `lib/hello-k8s.ts` for your first k8s stack:

```ts
import { Stack } from 'k8scdk';
import { Construct } from '@aws-cdk/core';

export class HelloKube extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

  }
}
```

### Resources

Now, inside your stack, define the service and deployment resources. This is
identical to defining the YAML described in https://github.com/paulbouwer/hello-kubernetes:

```ts
const label = { app: 'hello-k8s' };

new KubService(this, 'service', {
  type: 'LoadBalancer',
  ports: [ { port: 80, targetPort: 8080 } ],
  selector: label
});

new KubDeployment(this, 'deployment', {
  replicas: 2,
  selector: {
    matchLabels: label
  },
  template: {
    metadata: { labels: label },
    spec: {
      containers: [
        {
          name: 'hello-kubernetes',
          image: 'paulbouwer/hello-kubernetes:1.5',
          ports: [ { containerPort: 8080 } ]
        }
      ]
    }
  }
});
```

You'll see that the class names start with `Kub` (i.e. `KubDeployment`). This is
because these classes are automatically generated from the Kubernetes API spec
and represent 1:1 the spec. Similarly to the AWS CDK, these are called "Layer 1
Constructs" or, in short, L1s.

The idea behind the L1 layer is that it exposes the entire configuration surface
area through strongly-typed classes. In a sense, you can think of this layer as
a DOM (document object model).

Similarly to the AWS CDK, since this layer is limited in it's ability to offer a
rich object-oriented experience (since it is based purely on the backend API),
there is a good chance that we will be able to offer a richer API on top of
these that will offer a much better experience for developers.

OK, now that we have our stack defined, let's go back to our application's entry
point (under `bin/`) and replace the code with:

### App

```ts
import { App, Stack } from '@aws-cdk/core';
import { HelloKube } from '../lib/hello-k8s';

const app = new App({ outdir: 'cdk.out' });

new HelloKube(app, 'hellowwwww');

app.synth();
```

### Deploy

Okay, we are ready to synthesize our first stack. Back to your terminal:

```console
$ node bin/hellowwwww-k8scdk.js
```

This should create a new directory `cdk.out` with a file `hello.k8s.yaml`
that contains the synthesized list of resources.

Now, all that remains is for you to apply this to your cluster:

```console
$ kubectl apply -f cdk.out/hellowwwww.k8s.yaml
service "hellowwwwwservice00939e38" created
deployment.apps "hellowwwwwdeploymentb485c4d9" created
```

You can find the service endpoint using:

```console
$ kubectl get service -o wide
NAME                        TYPE           CLUSTER-IP     EXTERNAL-IP                                                               PORT(S)        AGE       SELECTOR
hellowwwwwservice00939e38   LoadBalancer   172.20.23.55   a35b958eaaf1d11e9a26a0644f9d485a-1519168962.us-west-2.elb.amazonaws.com   80:30851/TCP   3m        app=hellowwwww
kubernetes                  ClusterIP      172.20.0.1     <none>                                                                    443/TCP        1h        <none>
```

And then, hit it with your browser!

You can find this example under [`examples/hello`](./examples/hello).

Use the `apply.sh` script to synthesize and apply to your cluster:

```bash
#!/bin/bash
node hello-k8s.js
kubectl apply -f cdk.out/hellowwwww.k8s.yaml
```

### Constructs

Constructs are the basic building block of the CDK (both AWS CDK and Kubernetes
CDK). They are the instrument that enables composition and creation of higher-level
abstractions through normal object-oriented classes.

If you come from the Kubernetes world, you can think of constructs as
programmatically defined Helm Charts. The nice thing about constructs being
"programmatically defined" is that we can leverage the full power of object-oriented
programming. For example:

* We can to express the abstraction's API using strong-typed data types,
* We can include methods, create polymorphic programming models through interfaces and base classes
* Share them through regular package managers
* Test them using our familiar testing tools and techniques
* Version them
* ...and all that stuff that we've been doing with software in the past 20 years.

So let's create our first Kubernetes construct. We'll call it `WebService` and it will basically
be a generalization of the hello world program. It's actually quite useful.

For example, this one line will add a hello world service to our stack:

```ts
new WebService(this, 'hello-k8s', {
  image: 'paulbouwer/hello-kubernetes:1.5'
});
```

It can also be customized through an API:

```ts
new WebService(this, 'hello-k8s', {
  image: 'paulbouwer/hello-kubernetes:1.5',
  containerPort: 8080,
  replicas: 10
});
```

The implementation of `WebService` is trivial:


```ts
import { Construct } from '@aws-cdk/core';
import { KubService, KubDeployment } from '../../lib';

export interface WebServiceOptions {
  /**
   * The Docker image to use for this service.
   */
  readonly image: string;

  /**
   * Number of replicas.
   *
   * @default 1
   */
  readonly replicas?: number;

  /**
   * External port.
   *
   * @default 80
   */
  readonly port?: number;

  /**
   * Internal port.
   *
   * @default 8080
   */
  readonly containerPort?: number;
}

export class WebService extends Construct {
  constructor(scope: Construct, ns: string, options: WebServiceOptions) {
    super(scope, ns);

    const port = options.port || 80;
    const containerPort = options.containerPort || 8080;
    const label = { app: this.node.uniqueId };

    new KubService(this, 'service', {
      type: 'LoadBalancer',
      ports: [ { port, targetPort: containerPort } ],
      selector: label
    });

    new KubDeployment(this, 'deployment', {
      replicas: 1,
      selector: {
        matchLabels: label
      },
      template: {
        metadata: { labels: label },
        spec: {
          containers: [
            {
              name: this.node.uniqueId,
              image: options.image,
              ports: [ { containerPort } ]
            }
          ]
        }
      }
    });
  }
}
```

But now, we have a new abstraction that we can use:

```ts
import { App, Construct } from '@aws-cdk/core';
import { Stack } from '../../lib';
import { WebService } from './web-service';

class MyStack extends Stack {
  constructor(scope: Construct, ns: string) {
    super(scope, ns);

    new WebService(this, 'hello', { image: 'paulbouwer/hello-kubernetes:1.5', replicas: 2 });
    new WebService(this, 'ghost', { image: 'ghost', containerPort: 2368 });
  }
}

const app = new App({ outdir: 'cdk.out' });
new MyStack(app, 'web-service-example');
app.synth();
```

## TODO

This is very preliminary work. There is a lot more to do:

Non-exhaustive, unordered, list:

- [ ] Generate Jsii-compatible interfaces from api spec
- [ ] Generate L1 construct classes for entire surface
- [ ] References and dependnecies between resources and stacks. Is this something that people need in k8s? Who will deployment work then?
- [ ] Support helm charts
- [ ] Consider if we really need L2s here
- [ ] AWS CDK interoperability: “kubectl apply” in CFN custom resource
- [ ] Real world pure example and example that uses AWS resources
- [ ] synth/deploy CLI (apply.sh)
- [ ] Resource removal
- [ ] Is `Stack` a good name?
- [ ] k8scdk or cdkk8s?
- [ ] Build in jsii
- [ ] Docker/ECR asset support with AWS CDK
- [ ] Setup CI
- [ ] Contribution Guide
- [ ] awslint-thing if we do L2


## License

Apache-2.0
