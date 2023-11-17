## 前端单元测试技术选型

- `Jest` Facebook 出品，功能全面，维护中
- `React Testing Library` React 组件测试的工具库，React 官方推荐

## 使用 Jest 测试一个函数

sum.js

```js
function sum(a, b) {
  return a + b;
}

export default sum;
```

sum.test.js

```js
import sum from "./sum";

test("adds 1 + 2 to equal 3", () => {
  expect(sum(1, 2)).toBe(3);
});
```

## 使用 Jest 测试一个 UI 组件

MySelect.js

```js
import { Select } from "antd";

export default Select;
```

MySelect.test.js

```js
import { render, screen, fireEvent } from "@testing-library/react";
import MySelect from "./MySelect";

const options = [
  { label: "labelA", value: "valueA" },
  { label: "labelB", value: "valueB" },
];

describe("测试MySelect组件", () => {
  test("正确渲染MySelect组件", () => {
    render(<MySelect options={options} />);

    expect(document.querySelector(".ant-select")).toBeInTheDocument();
  });

  test("MySelect组件点击后展示下拉框", () => {
    render(<MySelect options={options} />);

    fireEvent.mouseDown(document.querySelector(".ant-select-selector"));

    expect(
      document
        .querySelector(".ant-select")
        .classList.contains("ant-select-open")
    ).toBeTruthy();
  });

  test("MySelect组件点击下拉框触发onChange", () => {
    const onChange = jest.fn();

    render(<MySelect open options={options} onChange={onChange} />);

    fireEvent.click(
      screen.getByText("labelA", {
        selector: ".ant-select-item-option-content",
      })
    );
    expect(onChange).toHaveBeenCalledWith("valueA", {
      label: "labelA",
      value: "valueA",
    });
  });
});
```

- `describe` 定义了一系列测试的集合
- `test` 相当于一个测试用例，在一个测试用例只测一个方法或者其中的一个分支
- `render` 提供渲染组件的能力
- `screen` 扩展查询 dom 元素的方法
- `expect` 断言
- `fireEvent` 提供事件触发的能力
- `jest.fn()` mock 一个方法

## 使用 Jest 测试一个 业务 组件

product.js

```js
import { getProducts } from "./service";
import { useEffect, useState } from "react";

const Products = () => {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    getProducts.then((res) => {
      setProducts(res?.data || []);
    });
  }, []);

  return (
    <div>
      {products.map((el) => {
        return (
          <dl>
            <dt>{el.name}</dt>
            <dd>{el.desc}</dd>
          </dl>
        );
      })}
    </div>
  );
};

export default Products;
```

```js
import { render, screen } from "@testing-library/react";
import Products from "./Products";
import { getProducts } from "./service";

// mock service
jest.mock("./service", () => {
  return {
    getProducts: jest.fn(() =>
      Promise.resolve({ data: [{ name: "productA", desc: "very good" }] })
    ),
  };
});

describe("测试Products组件", () => {
  test("Products组件调用接口后正常渲染", async () => {
    render(<Products />);
    expect(getProducts).toHaveBeenCalledTimes(1);
    const titleElement = await screen.findByText("productA");
    expect(titleElement).toBeInTheDocument();
  });
});
```

- 用 `jest.mock` 模拟请求 API 接口的服务模块
- `screen.findByText` 可以等待渲染直到选择到元素

## 使用 Jest 测试具有 timer 的组件

Mylock.js

```js
import { useState } from "react";

const MyLock = () => {
  const [lock, setLock] = useState(false);

  const handleClick = () => {
    setLock(true);
    setTimeout(() => {
      setLock(false);
    }, 30000);
  };

  return (
    <div>
      <p>{lock ? "locked" : "nolock"}</p>
      <button onClick={handleClick}>lock 30s</button>
    </div>
  );
};

export default Mylock;
```

```js
import { act, render, screen, fireEvent } from "@testing-library/react";
import MyLock from "./MyLock";

jest.mock("./service", () => {
  return {
    getProducts: jest.fn(() =>
      Promise.resolve({ data: [{ name: "productA", desc: "very good" }] })
    ),
  };
});

describe("测试MyLock组件", () => {
  test("MyLock组件点击后30秒恢复", async () => {
    jest.useFakeTimers();
    render(<MyLock />);

    const nolock = await screen.findByText("nolock");
    expect(nolock).toBeInTheDocument();

    const button = await screen.findByText("lock 30s");
    fireEvent.click(button);

    const locked = await screen.findByText("locked");
    expect(locked).toBeInTheDocument();

    act(() => {
      jest.runAllTimers();
    });

    const nolock2 = await screen.findByText("nolock");
    expect(nolock2).toBeInTheDocument();
    jest.useRealTimers();
  });
});
```

- `jest.useFakeTimers()` 模拟定时器，跳过等待时间
- `jest.runAllTimers()` 跳过所有 timer 等待时间，直到回调执行
- `act` 确保断言前，所有的更新都已处理并应用于 DOM

## 使用 Jest 测试 React hook

counter.js

```js
import { useState, useCallback } from "react";

function useCounter() {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => setCount((x) => x + 1), []);

  return { count, increment };
}

export default useCounter;
```

counter.test.js

```js
import { renderHook, act } from "@testing-library/react-hooks";
import useCounter from "./useCounter";

test("should increment counter", () => {
  const { result } = renderHook(() => useCounter());

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

- `@testing-library/react-hooks` 提供测试 react hook 的能力，比较适合纯数据处理
- 涉及到组件渲染的 hook 还是要用 `@testing-library/react` 进行测试

## 使用 Jest 测试 mobx-react 组件

store.js

```js
import { observable, action } from "mobx";
import { getProducts } from "./service";

export class ProductStore {
  data = observable({
    products: [],
  });

  setData = action((key, value) => {
    this.data[key] = value;
  });

  fetchProducts = action(async () => {
    const res = await getProducts();
    this.setData("products", res.data);
  });
}

const productStore = new ProductStore();

export default productStore;
```

MyProduct.js

```js
import { useEffect } from "react";
import { inject, observer } from "mobx-react";

const Products = ({ product }) => {
  useEffect(() => {
    product.fetchProducts();
  }, []);

  return (
    <div>
      {product.data.products.map((el) => {
        return (
          <dl key={el.name}>
            <dt>{el.name}</dt>
            <dd>{el.desc}</dd>
          </dl>
        );
      })}
    </div>
  );
};

export default inject((store) => {
  return {
    product: store.product,
  };
})(observer(Products));
```

MyProduct.test.js

```js
import { render, screen } from "@testing-library/react";
import { Provider } from "mobx-react";
import MyProduct from "./MyProduct";
import store from "./store";
import { getProducts } from "./service";

jest.mock("./service", () => {
  return {
    getProducts: jest.fn(() =>
      Promise.resolve({ data: [{ name: "productA", desc: "very good" }] })
    ),
  };
});

describe("测试MyProduct组件", () => {
  test("正确渲染MyProduct组件", async () => {
    render(
      <Provider product={store}>
        <MyProduct />
      </Provider>
    );
    expect(getProducts).toHaveBeenCalledTimes(1);
    const product = await screen.findByText("productA");
    expect(product).toBeInTheDocument();
    act(() => {
      store.setData({ products: [{ name: "productB", desc: "very good" }] });
    });
    const productB = await screen.findByText("productB");
    expect(productB).toBeInTheDocument();
  });
});
```

- 通过 mobx-react 的 `Provider` 模拟需要的 context 环境
- 在 `act` 里触发 action, 修改 store 里的数据

## 覆盖率指标

- 语句覆盖率（statement coverage）：是不是每个语句都执行了？

- 分支覆盖率（branch coverage）：是不是每个 if 代码块都执行了？

- 函数覆盖率（function coverage）：是不是每个函数都调用了？

- 行覆盖率（line coverage）：是不是每一行都执行了？

## 阅读更多

- jest api
  <https://jestjs.io/docs/api>

- jest 模块 mock
  <https://jestjs.io/docs/bypassing-module-mocks>

- React Testing Library 文档
  <https://testing-library.com/docs/react-testing-library/intro>

- React Testing Library demo
  <https://testing-library.com/docs/example-input-event>

- React 单元测试
  <https://github.com/facebook/react/tree/main/packages/react-dom/src/__tests__>

- rc-select 单元测试
  <https://github.com/react-component/select/tree/master/tests>

- ahooks 单元测试
  <https://github.com/alibaba/hooks/blob/master/packages/hooks/src/useClickAway/__tests__>

- mobx-react 单元测试
  <https://github.com/mobxjs/mobx/tree/main/packages/mobx-react/__tests__>

- mobx-react-lite 单元测试
  <https://github.com/mobxjs/mobx/tree/main/packages/mobx-react-lite/__tests__>

- vscode 插件
  - Jest 官方，强大
  - Jest Run It 轻量，简单
