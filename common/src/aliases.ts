export namespace Aliases {
	export type AbstractConstraint = {
		name: string;
		x: number;
		y: number;
		classification: number;
		serializedArguments: string;
	}

	export type Segment = {
		x: number;
		y: number;
		l: number;
		d: number;
	};

	export type BoardMatrix<C extends AbstractConstraint> = { p: number, t: C | null }[][];
	export type PartitionList<C extends AbstractConstraint> = { x: number, y: number, t: C | null }[][];
	export type Constrainer<C extends AbstractConstraint> = (
		mtx: BoardMatrix<C>, 
		parts: PartitionList<C>, 
		horizontalPathSegments: PathSegmentAggregator, 
		verticalPathSegments: PathSegmentAggregator,
	) => number;
	export type PathSegmentAggregator = number[][];
}