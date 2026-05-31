import {
  AdHocFiltersVariable,
  SceneObjectBase,
  type SceneObjectState,
  type SceneVariable,
  SceneQueryRunner,
  VariableDependencyConfig,
} from '@grafana/scenes';
import { MIXED_DATASOURCE_NAME } from 'app/plugins/datasource/mixed/MixedDataSource';

interface MixedDatasourceAdHocFiltersBehaviorState extends SceneObjectState {}

export class MixedDatasourceAdHocFiltersBehavior extends SceneObjectBase<MixedDatasourceAdHocFiltersBehaviorState> {
  private _variableDependency?: VariableDependencyConfig<MixedDatasourceAdHocFiltersBehaviorState>;

  public constructor(state: MixedDatasourceAdHocFiltersBehaviorState) {
    super(state);

    this.addActivationHandler(() => this._activationHandler());
  }

  private _activationHandler() {
    const queryRunner = this.parent;

    if (!(queryRunner instanceof SceneQueryRunner) || queryRunner.state.datasource?.uid !== MIXED_DATASOURCE_NAME) {
      return;
    }

    this._variableDependency = new VariableDependencyConfig(this, {
      onAnyVariableChanged: (variable: SceneVariable) => {
        if (variable instanceof AdHocFiltersVariable && this.hasQueryForDatasource(queryRunner, variable.state.datasource?.uid)) {
          queryRunner.runQueries();
        }
      },
    });
  }

  private hasQueryForDatasource(queryRunner: SceneQueryRunner, datasourceUid?: string): boolean {
    return Boolean(datasourceUid && queryRunner.state.queries.some((query) => query.datasource?.uid === datasourceUid));
  }
}
