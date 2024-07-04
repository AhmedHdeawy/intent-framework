import { Injectable } from "@nestjs/common";
import { existsSync } from "fs";
import { join } from "path";
import { Eta } from "eta";
import { path } from "app-root-path";
import { Node, Project, SyntaxKind } from "ts-morph";

@Injectable()
export class CodegenService {
  private templateEngine: Eta;

  constructor() {
    this.templateEngine = new Eta({
      cache: true,
      views: join(path, "stubs"),
    });
  }

  async checkIfFileAlreadyExists(filePath: string): Promise<void> {
    const doesFileExists = existsSync(join(path, filePath));
    if (doesFileExists) {
      throw new Error(`${filePath} already exists`);
    }
  }

  async createConfigFile(options: Record<string, any>): Promise<void> {
    const { filePath, fileNameWithoutEx, input = {} } = options;
    await this.checkIfFileAlreadyExists(filePath);

    const content = await this.templateEngine.renderAsync("config", input);
    const project = new Project({});
    const newFile = project.createSourceFile(join(path, filePath), content, {
      overwrite: false,
    });
    await newFile.save();

    // update the index.ts file
    const indexFile = project.addSourceFileAtPath(
      join(path, "config/index.ts")
    );

    indexFile.addImportDeclaration({
      defaultImport: fileNameWithoutEx,
      moduleSpecifier: `./${fileNameWithoutEx}`,
    });

    const defaultExport = indexFile.getExportAssignment(
      (assignment) => assignment.isExportEquals() === false
    );

    if (!defaultExport) return;
    const exportExpression = defaultExport.getExpression();
    const arrayLiteral = exportExpression.asKindOrThrow(
      SyntaxKind.ArrayLiteralExpression
    );
    arrayLiteral.addElement(fileNameWithoutEx);
    await indexFile.save();

    console.timeEnd("ttl");
  }

  async createController(options: Record<string, any>): Promise<void> {
    const { input, filePath, fileNameWithoutEx } = options;
    await this.checkIfFileAlreadyExists(filePath);

    const project = new Project();
    const content = await this.templateEngine.renderAsync("controller", input);
    const newController = project.createSourceFile(
      join(path, filePath),
      content,
      { overwrite: false }
    );
    await newController.save();

    // update module.ts
    const moduleFile = project.addSourceFileAtPath(
      join(path, "app", "module.ts")
    );
    const classDeclaration = moduleFile.getClassOrThrow("AppModule");
    const moduleDecorator = classDeclaration.getDecoratorOrThrow("Module");
    const moduleDecoratorArg = moduleDecorator.getArguments()[0];

    const moduleObjectLiteral = moduleDecoratorArg.asKindOrThrow(
      SyntaxKind.ObjectLiteralExpression
    );

    const controllersProperty = moduleObjectLiteral.getProperty("controllers");

    if (Node.isPropertyAssignment(controllersProperty)) {
      const controllersArray = controllersProperty
        .getInitializer()
        .asKindOrThrow(SyntaxKind.ArrayLiteralExpression);
      controllersArray.addElement(input.controllerName);
    }

    moduleFile.addImportDeclaration({
      namedImports: [input.controllerName],
      moduleSpecifier: `./controllers/${fileNameWithoutEx}`,
    });

    await moduleFile.save();
  }

  async createService(options: Record<string, any>): Promise<void> {
    const { input, filePath, fileNameWithoutEx } = options;
    await this.checkIfFileAlreadyExists(filePath);

    const project = new Project();
    const content = await this.templateEngine.renderAsync("service", input);
    const newController = project.createSourceFile(
      join(path, filePath),
      content,
      { overwrite: false }
    );
    await newController.save();

    // update module.ts
    const moduleFile = project.addSourceFileAtPath(
      join(path, "app", "module.ts")
    );
    const classDeclaration = moduleFile.getClassOrThrow("AppModule");
    const moduleDecorator = classDeclaration.getDecoratorOrThrow("Module");
    const moduleDecoratorArg = moduleDecorator.getArguments()[0];

    const moduleObjectLiteral = moduleDecoratorArg.asKindOrThrow(
      SyntaxKind.ObjectLiteralExpression
    );

    const controllersProperty = moduleObjectLiteral.getProperty("providers");

    if (Node.isPropertyAssignment(controllersProperty)) {
      const controllersArray = controllersProperty
        .getInitializer()
        .asKindOrThrow(SyntaxKind.ArrayLiteralExpression);
      controllersArray.addElement(input.className);
    }

    moduleFile.addImportDeclaration({
      namedImports: [input.className],
      moduleSpecifier: `./services/${fileNameWithoutEx}`,
    });

    await moduleFile.save();
  }

  async createException(options: Record<string, any>): Promise<void> {
    const { input, filePath } = options;
    await this.checkIfFileAlreadyExists(filePath);

    const project = new Project();
    const content = await this.templateEngine.renderAsync("exception", input);
    const newException = project.createSourceFile(
      join(path, filePath),
      content,
      { overwrite: false }
    );
    await newException.save();
  }

  async createRepo(options: Record<string, any>): Promise<void> {
    const { input, filePath, fileNameWithoutEx, repoToken } = options;
    await this.checkIfFileAlreadyExists(filePath);

    const content = await this.templateEngine.renderAsync(
      "repositoryDB",
      input
    );

    const project = new Project();

    const newSourceFile = project.createSourceFile(
      join(path, filePath),
      content,
      { overwrite: false }
    );
    await newSourceFile.save();

    // update module.ts
    const moduleFile = project.addSourceFileAtPath(
      join(path, "app", "module.ts")
    );

    const classDeclaration = moduleFile.getClassOrThrow("AppModule");
    const moduleDecorator = classDeclaration.getDecoratorOrThrow("Module");
    const moduleDecoratorArg = moduleDecorator.getArguments()[0];

    const moduleObjectLiteral = moduleDecoratorArg.asKindOrThrow(
      SyntaxKind.ObjectLiteralExpression
    );

    const controllersProperty = moduleObjectLiteral.getProperty("providers");

    if (Node.isPropertyAssignment(controllersProperty)) {
      const controllersArray = controllersProperty
        .getInitializer()
        .asKindOrThrow(SyntaxKind.ArrayLiteralExpression);
      controllersArray.addElement(
        `{ provide: '${repoToken}', useClass: ${input.className}, }`
      );
    }

    moduleFile.addImportDeclaration({
      namedImports: [input.className],
      moduleSpecifier: `./repositories/${fileNameWithoutEx}`,
    });

    await moduleFile.save();
  }

  async createModel(options: Record<string, any>): Promise<void> {
    const { input, filePath } = options;
    await this.checkIfFileAlreadyExists(filePath);

    const project = new Project();
    const content = await this.templateEngine.renderAsync("model", input);
    const newController = project.createSourceFile(
      join(path, filePath),
      content,
      { overwrite: false }
    );
    await newController.save();
  }
}
